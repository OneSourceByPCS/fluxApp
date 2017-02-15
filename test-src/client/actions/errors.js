/* global describe, it, afterEach, document, sinon, expect */
import React from 'react';
import DOM from '../lib/dom';
import Promise from 'bluebird';
import fluxapp, { BaseActions, BaseStore, Component } from '../../../lib';

export default () => {
  describe('errors', () => {
    let renderedComponent;

    function renderComponent(Comp, context) {
      const elem = document.createElement('div');

      context = context && context.context ? context.context : fluxapp.createContext(context);
      const ContextWrapper = context.wrapper;

      document.body.appendChild(elem);

      return DOM.render((
        <ContextWrapper handler={Comp} context={context} />
      ), elem);
    }

    before(() => {
      const actionClass = class TestActions extends BaseActions {
        error() {
          throw new Error('action error');
        }

        asyncError() {
          return new Promise((resolve, reject) => {
            setTimeout(resolve, 500);
          }).then(() => {
            throw new Error('action async error');
          });
        }

        storeAsync() {
          return new Promise((resolve, reject) => {
            setTimeout(resolve, 500);
          }).then(() => {
            return {};
          });
        }

        storeSync() {}

        sync() {}
        async() {}
      };

      fluxapp.registerActions('testing', actionClass);

      const storeClass = class TestStore extends BaseStore {
        static actions = {
          onAsyncError : 'testing.storeAsync',
          onSyncError : 'testing.storeSync',
        }

        onSyncError(result) {
          throw new Error('store sync error');
        }

        onAsyncError(result) {
          return new Promise((resolve, reject) => {
            setTimeout(resolve, 500);
          }).then(() => {
            throw new Error('store async error');
          });
        }
      };

      fluxapp.registerStore('testing', storeClass);
    });

    after(() => {
      fluxapp._stores = {};
      fluxapp._actions = {};
    });

    afterEach(() => {
      if (renderedComponent) {
        const elem = DOM.findDOMNode(renderedComponent).parentNode;
        DOM.unmountComponentAtNode(elem);
        document.body.removeChild(elem);
      }

      renderedComponent = null;
    });

    it('action error sync', (done) => {
      const context = fluxapp.createContext();
      const spy = sinon.spy();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onFailed : 'testing.error:failed',
        };

        onFailed() {
          spy();
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      context.getActions('testing').error()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        expect(spy.called).to.equal(true);
        done();
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('action error');
          expect(event.payload.type).to.equal('action');
        }
      });
    });

    it('action error async', (done) => {
      const context = fluxapp.createContext();
      const spy = sinon.spy();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onFailed : 'testing.asyncError:failed',
        };

        onFailed() {
          spy();
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      context.getActions('testing').asyncError()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        expect(spy.called).to.equal(true);
        done();
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('action async error');
          expect(event.payload.type).to.equal('action');
        }
      });
    });

    it('store async error', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      context.getActions('testing').storeAsync()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('store async error');
          expect(event.payload.type).to.equal('listener');
        }
      });
    });

    it('store sync error', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('store sync error');
          expect(event.payload.type).to.equal('listener');
        }
      });

      context.getActions('testing').storeSync()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });
    });

    it('before sync event', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onBefore : 'testing.sync:before',
        };

        onBefore() {
          throw new Error('testing before');
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('testing before');
          expect(event.payload.type).to.equal('before');
        }
      });

      context.getActions('testing').sync()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });
    });

    it('before async event', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onBefore : 'testing.async:before',
        };

        onBefore() {
          throw new Error('testing before');
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('testing before');
          expect(event.payload.type).to.equal('before');
        }
      });

      context.getActions('testing').async()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });
    });

    it('after sync event', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onAfter : 'testing.sync:after',
        };

        onAfter() {
          throw new Error('testing after');
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('testing after');
          expect(event.payload.type).to.equal('after');
        }
      });

      context.getActions('testing').sync()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });
    });

    it('after async event', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onAfter : 'testing.async:after',
        };

        onAfter() {
          throw new Error('testing after');
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('testing after');
          expect(event.payload.type).to.equal('after');
        }
      });

      context.getActions('testing').async()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });
    });

    it('failed sync event', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onFailed : 'testing.error:failed',
        };

        onFailed() {
          throw new Error('testing failed');
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('testing failed');
          expect(event.payload.type).to.equal('failed');
        }
      });

      context.getActions('testing').error()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });
    });

    it('failed async event', (done) => {
      const context = fluxapp.createContext();
      const globalSpy = sinon.spy();

      const Comp = class TestComponent extends Component {
        static actions = {
          onFailed : 'testing.asyncError:failed',
        };

        onFailed() {
          throw new Error('testing async failed');
        }

        render() {
          return (
            <h1>Hello</h1>
          );
        }
      };

      renderedComponent = renderComponent(Comp, {
        context : context,
      });

      const Dispatcher = context.getDispatcher();

      const token = Dispatcher.register((event) => {
        if (event.actionType === 'ACTION_FAILED') {
          globalSpy();
          expect(event.payload.error.message).to.equal('testing async failed');
          expect(event.payload.type).to.equal('failed');
        }
      });

      context.getActions('testing').asyncError()
      .then(() => {
        expect(globalSpy.called).to.equal(true);
        done();
      });
    });
  });
};