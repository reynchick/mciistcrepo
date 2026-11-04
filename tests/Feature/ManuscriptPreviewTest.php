<?php

use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use App\Services\ManuscriptPreviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;

uses(RefreshDatabase::class);

function createPreviewResearch(string $privateContent = 'Private manuscript content.'): Research
{
    Storage::fake('private');

    $pdf = new Mpdf;
    $pdf->WriteHTML('<h1>Preview fixture</h1><p>'.$privateContent.'</p>');
    $research = Research::factory()->posted()->create([
        'program_id' => Program::factory()->create()->id,
        'research_manuscript' => 'research/manuscripts/preview-fixture.pdf',
    ]);
    Storage::disk('private')->put($research->research_manuscript, $pdf->Output('', 'S'));

    return $research;
}

test('authenticated users can retrieve manuscript preview page count without receiving the PDF path', function () {
    $research = createPreviewResearch();
    $user = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);
    $this->mock(ManuscriptPreviewService::class)
        ->shouldReceive('pageCount')
        ->once()
        ->withArgs(fn (Research $model): bool => $model->is($research))
        ->andReturn(1);

    $this->actingAs($user)->getJson("/research/{$research->id}/preview")
        ->assertOk()
        ->assertJsonPath('page_count', 1)
        ->assertJsonMissingPath('research_manuscript');
});

test('guests cannot retrieve preview metadata or page images', function () {
    $research = createPreviewResearch();

    $this->get("/research/{$research->id}/preview")->assertRedirect();
    $this->get("/research/{$research->id}/preview/pages/1")->assertRedirect();
});

test('users who cannot view a research record cannot access its preview', function () {
    $research = Research::factory()->draft()->create([
        'program_id' => Program::factory()->create()->id,
        'research_manuscript' => 'research/manuscripts/private-draft.pdf',
    ]);
    $student = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);

    $this->actingAs($student)->getJson("/research/{$research->id}/preview")
        ->assertForbidden();
    $this->actingAs($student)->get("/research/{$research->id}/preview/pages/1")
        ->assertForbidden();
});

test('the legacy manuscript route continues to deny every user', function () {
    $research = createPreviewResearch();
    $admin = User::factory()->asAdministrator()->create();

    $this->actingAs($admin)->get("/research/{$research->id}/manuscript")
        ->assertForbidden();
});

test('preview metadata reports missing rasterizer configuration before opening the viewer', function () {
    $research = createPreviewResearch();
    $admin = User::factory()->asAdministrator()->create();
    config(['manuscript-preview.rasterizer_binary' => sys_get_temp_dir().DIRECTORY_SEPARATOR.'missing-preview-rasterizer.exe']);

    $response = $this->actingAs($admin)->getJson("/research/{$research->id}/preview");
    if ($response->getStatusCode() === 200) {
        $this->markTestSkipped('A Ghostscript renderer is available through the configured fallback.');
    }

    $response->assertStatus(503)
        ->assertJsonPath('message', 'The PDF preview renderer is not installed or configured. Set MANUSCRIPT_PREVIEW_RASTERIZER to the Ghostscript executable.');
});

test('a configured absolute rasterizer path is accepted', function () {
    $research = createPreviewResearch();
    config(['manuscript-preview.rasterizer_binary' => PHP_BINARY]);

    expect(app(ManuscriptPreviewService::class)->pageCount($research))->toBe(1);
});

test('page watermark is tiled across multiple horizontal bands', function () {
    $imagePath = tempnam(sys_get_temp_dir(), 'watermark-test-');
    expect($imagePath)->not->toBeFalse();

    $image = imagecreatetruecolor(1200, 1600);
    $white = imagecolorallocate($image, 255, 255, 255);
    imagefill($image, 0, 0, $white);
    imagepng($image, $imagePath);
    imagedestroy($image);

    try {
        $method = new ReflectionMethod(ManuscriptPreviewService::class, 'applyWatermark');
        $method->invoke(app(ManuscriptPreviewService::class), $imagePath, Research::factory()->create());

        $watermarkedImage = imagecreatefrompng($imagePath);
        expect($watermarkedImage)->not->toBeFalse();

        $changedBands = 0;
        foreach ([[150, 450], [500, 800], [850, 1150], [1200, 1500]] as [$top, $bottom]) {
            $changedPixels = 0;
            for ($y = $top; $y < $bottom; $y += 4) {
                for ($x = 0; $x < 1200; $x += 4) {
                    if ((imagecolorat($watermarkedImage, $x, $y) & 0xFFFFFF) !== 0xFFFFFF) {
                        $changedPixels++;
                    }
                }
            }
            if ($changedPixels > 20) $changedBands++;
        }

        expect($changedBands)->toBeGreaterThanOrEqual(3);
    } finally {
        if (is_file($imagePath)) unlink($imagePath);
    }
});

test('preview page endpoint serves image content inline without returning a PDF', function () {
    Storage::fake('private');
    $research = Research::factory()->posted()->create(['program_id' => Program::factory()->create()->id]);
    $admin = User::factory()->asAdministrator()->create();
    $imagePath = Storage::disk('private')->path('research/previews/test-page.png');
    Storage::disk('private')->put('research/previews/test-page.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII='));
    $service = Mockery::mock(ManuscriptPreviewService::class);
    $service->shouldReceive('pageCount')
        ->once()
        ->withArgs(fn (Research $model): bool => $model->is($research))
        ->andReturn(1);
    $service->shouldReceive('pageImage')
        ->once()
        ->withArgs(fn (Research $model, int $page): bool =>
            $model->is($research)
            && $page === 1
        )
        ->andReturn($imagePath);
    $this->instance(ManuscriptPreviewService::class, $service);

    $this->actingAs($admin)->getJson("/research/{$research->id}/preview")->assertOk();

    $this->actingAs($admin)->get("/research/{$research->id}/preview/pages/1")
        ->assertOk()
        ->assertHeader('Content-Type', 'image/png')
        ->assertHeader('Content-Disposition', 'inline; filename="research-page-1.png"')
        ->assertHeader('Cache-Control', 'no-store, private');
});

test('preview routes are rate-limited per signed-in user and research', function () {
    $research = createPreviewResearch();
    $admin = User::factory()->asAdministrator()->create();
    RateLimiter::clear('manuscript-preview:'.$admin->id.':'.$research->id);
    $this->mock(ManuscriptPreviewService::class)
        ->shouldReceive('pageCount')
        ->times(30)
        ->withArgs(fn (Research $model): bool => $model->is($research))
        ->andReturn(1);

    for ($request = 0; $request < 30; $request++) {
        $this->actingAs($admin)->getJson("/research/{$research->id}/preview")->assertOk();
    }

    $this->actingAs($admin)->getJson("/research/{$research->id}/preview")
        ->assertTooManyRequests();
});

test('preview cache cleanup removes all pages for a research record', function () {
    $research = Research::factory()->create(['program_id' => Program::factory()->create()->id]);
    $path = "research/previews/{$research->id}/source-hash/page-1.png";
    Storage::disk('private')->put($path, 'watermarked page');

    app(ManuscriptPreviewService::class)->clearCache($research);

    Storage::disk('private')->assertMissing($path);
});
