import compiler from '@ampproject/rollup-plugin-closure-compiler';

export default [
    {
        input: 'src/index.js',
        output: [
            { file: 'delegate.js', format: 'umd', name: 'delegate', esModule: false }
        ]
    },
    {
        input: 'src/index.js',
        output: [
            { file: 'esm/delegate.js', format: 'es' },
            { file: 'delegate.min.js', format: 'umd', name: 'delegate', esModule: false }
        ],
        plugins: [compiler()]
    }
];
