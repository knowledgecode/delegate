import { getBabelOutputPlugin } from '@rollup/plugin-babel';
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
                plugins: [terser()]
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
            },
            {
                file: 'es5/delegate.js',
                format: 'umd',
                name: 'delegate',
                esModule: false,
                plugins: [getBabelOutputPlugin({ allowAllFormats: true, presets: ['@babel/preset-env'] })]
            },
            {
                file: 'es5/delegate.min.js',
                format: 'umd',
                name: 'delegate',
                esModule: false,
                plugins: [getBabelOutputPlugin({ allowAllFormats: true, presets: ['@babel/preset-env'] }), terser({ ecma: 5 })]
            }
        ]
    }
];
