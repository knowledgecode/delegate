import terser from '@rollup/plugin-terser';

export default [
    {
        input: 'src/index.js',
        output: [
            { file: 'dist/esm/delegate.js', format: 'es' }
        ],
        plugins: [terser()]
    },
    {
        input: 'src/index.js',
        output: [
            { file: 'dist/iife/delegate.js', format: 'iife', name: 'delegate' }
        ],
        plugins: [terser()]
    }
];
