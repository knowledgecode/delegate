import compiler from '@ampproject/rollup-plugin-closure-compiler';

export default [
    {
        input: 'src/index.js',
        output: [
            { file: 'esm/delegate.es.js', format: 'es' },
            { file: 'delegate.js', format: 'umd', name: 'delegate', esModule: false }
        ]
    },
    {
        input: 'src/index.js',
        output: [
            { file: 'esm/delegate.es.min.js', format: 'es' },
            { file: 'delegate.min.js', format: 'umd', name: 'date', esModule: false }
        ],
        plugins: [compiler()]
    }
];
