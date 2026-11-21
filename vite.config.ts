import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig, lazyPlugins } from 'vite-plus';

// Los tests (vp test) son de lógica pura en resources/js/lib: no necesitan los
// plugins de Laravel. El de Wayfinder, además, corre `php artisan` al
// arrancar y en el CI choca con los workers de test en paralelo.
const enTests = process.env.VITEST !== undefined;

export default defineConfig({
    test: {
        include: ['resources/js/**/*.test.ts'],
    },
    plugins: lazyPlugins(() =>
        enTests
            ? []
            : [
                  laravel({
                      input: ['resources/css/app.css', 'resources/js/app.ts'],
                      refresh: true,
                      fonts: [
                          bunny('Inter', {
                              weights: [400, 500, 600, 700],
                          }),
                      ],
                  }),
                  inertia(),
                  tailwindcss(),
                  vue({
                      template: {
                          transformAssetUrls: {
                              base: null,
                              includeAbsolute: false,
                          },
                      },
                  }),
                  wayfinder({
                      formVariants: true,
                  }),
              ],
    ),
    server: {
        watch: {
            ignored: [
                '**/.agents/**',
                '**/.claude/**',
                '**/.cursor/**',
                '**/.junie/**',
                '**/vendor/**',
            ],
        },
    },
    lint: {
        ignorePatterns: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/ssr/**',
            'tailwind.config.js',
            'resources/js/actions/**',
            'resources/js/components/ui/*',
            'resources/js/routes/**',
            'resources/js/wayfinder/**',
        ],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    fmt: {
        printWidth: 80,
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        singleAttributePerLine: false,
        htmlWhitespaceSensitivity: 'css',
        ignorePatterns: [
            '.github/**',
            'composer.json',
            'resources/js/components/ui/*',
            'resources/views/mail/*',
        ],
        sortTailwindcss: {
            functions: ['clsx', 'cn', 'cva'],
            stylesheet: 'resources/css/app.css',
        },
    },
});
