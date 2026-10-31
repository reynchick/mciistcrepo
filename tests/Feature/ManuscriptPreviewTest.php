<?php

use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use App\Services\ManuscriptPreviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

test('page rendering fails closed when the configured PDF rasterizer is unavailable', function () {
    $privateContent = 'Private manuscript content '.bin2hex(random_bytes(8));
    $research = createPreviewResearch($privateContent);
    $admin = User::factory()->asAdministrator()->create();
    config(['manuscript-preview.rasterizer_binary' => 'missing-preview-rasterizer']);

    $this->actingAs($admin)->get("/research/{$research->id}/preview/pages/1")
        ->assertStatus(422)
        ->assertDontSee($privateContent);
});

test('preview cache cleanup removes all pages for a research record', function () {
    $research = Research::factory()->create(['program_id' => Program::factory()->create()->id]);
    $path = "research/previews/{$research->id}/source-hash/page-1.png";
    Storage::disk('private')->put($path, 'watermarked page');

    app(ManuscriptPreviewService::class)->clearCache($research);

    Storage::disk('private')->assertMissing($path);
});
