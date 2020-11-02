import { terser } from 'rollup-plugin-terser';

export default [
    {
        input: 'src/index.js',
        output: [
            {
                file: 'esm/delegate.es.js',
                format: 'es'
            },
            {
                file: 'esm/delegate.es.min.js',
                format: 'es',
                plugins: [terser({ module: true })]
            },
            {
                file: 'delegate.js',
                format: 'umd',
                name: 'delegate',
                esModule: false
            },
            {
                file: 'delegate.min.js',
                format: 'umd',
                name: 'delegate',
                esModule: false,
                plugins: [terser()]
            }
        ]
    }
];
