/*global describe, before, it, afterEach, expect */

import delegate from '/base/dist/esm/delegate.js';

describe('test', () => {
    before(() => {
        return fetch('/base/test/index.html')
            .then(res => res.text())
            .then(html => document.body.insertAdjacentHTML('beforeend', html));
    });

    afterEach(() => {
        delegate(document).clear();
    });

    it('on 1', done => {
        delegate(document).on('click', '.div1', evt => {
            expect(evt.originalEvent.type).to.equal('click');
            done();
        });
        document.querySelector('.div1').click();
    });

    it('on 2', done => {
        delegate(document).on('click', evt => {
            expect(evt.originalEvent.type).to.equal('click');
            done();
        });
        document.body.click();
    });

    it('on 3', done => {
        const iframe = document.createElement('iframe');

        delegate(iframe).on('load', evt => {
            expect(evt.originalEvent.type).to.equal('load');
            done();
        });
        iframe.src = '/base/test/index.html';
        document.body.appendChild(iframe);
    });

    it('one', done => {
        let counter = 0;

        delegate(document).one('click', '.div1', () => {
            counter++;
        });
        document.querySelector('.div1').click();
        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(1);
            done();
        });
    });

    it('off 1', done => {
        let counter = 0;
        const handler1 = () => counter++;
        const handler2 = () => counter++;

        delegate(document)
            .on('click', '.div1', handler1)
            .on('click', '.div1', handler2)
            .on('click', handler1)
            .off('click', '.div1', handler1);

        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(2);
            done();
        });
    });

    it('off 2', done => {
        let counter = 0;
        const handler1 = () => counter++;
        const handler2 = () => counter++;

        delegate(document)
            .on('click', '.div1', handler1)
            .on('click', '.div1', handler2)
            .on('click', handler1)
            .off('click', '.div1');

        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(1);
            done();
        });
    });

    it('off 3', done => {
        let counter = 0;
        const handler1 = () => counter++;
        const handler2 = () => counter++;

        delegate(document)
            .on('click', '.div1', handler1)
            .on('click', '.div1', handler2)
            .on('click', handler1)
            .off('click', handler1);

        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(2);
            done();
        });
    });

    it('off 4', done => {
        let counter = 0;
        const handler1 = () => counter++;
        const handler2 = () => counter++;

        delegate(document)
            .on('click', '.div1', handler1)
            .on('click', handler2)
            .off('click');

        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(0);
            done();
        });
    });

    it('off 5', done => {
        let counter = 0;
        const handler1 = () => counter++;
        const handler2 = () => counter++;

        delegate(document)
            .on('click', '.div1', handler1)
            .on('click', handler2)
            .off();

        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(0);
            done();
        });
    });

    it('preventDefault', done => {
        let counter = 0;
        const handler1 = evt => {
            evt.preventDefault();
            counter++;
        };
        const handler2 = () => counter++;

        delegate(document)
            .on('click', 'input[type="checkbox"]', handler1)
            .on('change', 'input[type="checkbox"]', handler2);

        document.querySelector('input[type="checkbox"]').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(1);
            done();
        });
    });

    it('stopPropagation', done => {
        let counter = 0;
        const handler1 = evt => {
            evt.stopPropagation();
            counter++;
        };
        const handler2 = () => counter++;

        delegate(document)
            .on('click', '.div1', handler1)
            .on('click', '.div2', handler2);

        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(1);
            done();
        });
    });

    it('stopImmediatePropagation', done => {
        let counter = 0;
        const handler1 = evt => {
            evt.stopImmediatePropagation();
            counter++;
        };
        const handler2 = () => counter++;

        delegate(document)
            .on('click', '.div1', handler1)
            .on('click', '.div1', handler2);

        document.querySelector('.div1').click();

        Promise.resolve().then(() => {
            expect(counter).to.equal(1);
            done();
        });
    });
});
