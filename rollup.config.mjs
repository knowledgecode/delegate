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
            { file: 'dist/umd/delegate.js', format: 'umd', name: 'delegate' }
        ],
        plugins: [terser()]
    }
];
