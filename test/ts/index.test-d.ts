import { expectType } from 'tsd';
import delegate, { Delegate } from '../../src/index';

expectType<Delegate>(delegate(document));

expectType<Delegate>(delegate(document).on('click', '#button', evt => evt.preventDefault()));
expectType<Delegate>(delegate(document).on('click', evt => evt.stopPropagation()));

expectType<Delegate>(delegate(document).one('click', '#button', evt => evt.preventDefault()));
expectType<Delegate>(delegate(document).one('click', evt => evt.stopPropagation()));

expectType<Delegate>(delegate(document).off('click', '#button', evt => evt.preventDefault()));
expectType<Delegate>(delegate(document).off('click', evt => evt.stopPropagation()));
expectType<Delegate>(delegate(document).off('click', '#button'));
expectType<Delegate>(delegate(document).off('click'));
expectType<Delegate>(delegate(document).off());

expectType<void>(delegate(document).clear());
