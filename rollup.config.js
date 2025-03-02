import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/index.js',
    output: [
      { file: 'dist/esm/delegate.js', format: 'es' },
      { file: 'dist/umd/delegate.js', format: 'umd', name: 'delegate' }
    ],
    plugins: [
      terser()
    ]
  }
];
