<?php

it('serves the welcome page', function () {
    $response = $this->get('/');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});
