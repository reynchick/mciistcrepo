<?php

it('redirects from welcome to browse', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('browse'));
});
