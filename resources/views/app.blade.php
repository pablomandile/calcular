<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"  @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="description" content="CalculAR: calculadora, científica, TNA y TEA, plazo fijo, porcentajes y fechas, pensadas para Argentina.">
        <meta name="theme-color" content="#2a6aa3">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: #f7f9fc;
            }

            html.dark {
                background-color: #0d141c;
            }
        </style>

        {{-- PWA. Al cambiar un ícono: ?v= acá y en el manifest, y CACHE en sw.js. --}}
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="/favicon.ico?v=1" sizes="32x32">
        <link rel="icon" href="/favicon.svg?v=1" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=1">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="CalculAR">

        {{--
            Chrome dispara beforeinstallprompt apenas carga la página, antes de
            que monte Vue: se captura acá y el botón "Instalar app" lo lee de
            window.__pwaInstall (ver usePwaInstall.ts).
        --}}
        <script>
            (function () {
                window.__pwaInstall = { prompt: null, installed: false };
                window.addEventListener('beforeinstallprompt', function (e) {
                    e.preventDefault();
                    window.__pwaInstall.prompt = e;
                    window.dispatchEvent(new CustomEvent('pwa:installable'));
                });
                window.addEventListener('appinstalled', function () {
                    window.__pwaInstall.prompt = null;
                    window.__pwaInstall.installed = true;
                    window.dispatchEvent(new CustomEvent('pwa:installed'));
                });
                if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function () {
                        // ?v=: una URL nueva saltea una copia vieja en el CDN.
                        navigator.serviceWorker.register('/sw.js?v=1').catch(function () {});
                    });
                }
            })();
        </script>

        @fonts

        @vite(['resources/css/app.css', 'resources/js/app.ts', "resources/js/pages/{$page['component']}.vue"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
