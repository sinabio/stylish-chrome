'use strict';

if (!navigator.userAgent.includes('Windows')) {
  document.documentElement.classList.add('non-windows');
}

// polyfill for old browsers to enable [...results] and for-of
for (const type of [NodeList, NamedNodeMap, HTMLCollection, HTMLAllCollection]) {
  if (!type.prototype[Symbol.iterator]) {
    type.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
  }
}


function onDOMready() {
  if (document.readyState != 'loading') {
    return Promise.resolve();
  }
  return new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', function _() {
      document.removeEventListener('DOMContentLoaded', _);
      resolve();
    });
  });
}


function scrollElementIntoView(element) {
  // align to the top/bottom of the visible area if wasn't visible
  const bounds = element.getBoundingClientRect();
  if (bounds.top < 0 || bounds.top > innerHeight - bounds.height) {
    element.scrollIntoView(bounds.top < 0);
  }
}


function animateElement(element, {className, removeExtraClasses = [], remove = false}) {
  return new Promise(resolve => {
    element.addEventListener('animationend', function _() {
      element.removeEventListener('animationend', _);
      element.classList.remove(
        className,
        ...removeExtraClasses // In Firefox, `resolve()` might be called one frame later. This is helpful to clean-up on the same frame
      );
      // TODO: investigate why animation restarts if the elements is removed in .then()
      if (remove) {
        element.remove();
      }
      resolve();
    });
    element.classList.add(className);
  });
}


function enforceInputRange(element) {
  const min = Number(element.min);
  const max = Number(element.max);
  const doNotify = () => element.dispatchEvent(new Event('change', {bubbles: true}));
  const onChange = ({type}) => {
    if (type == 'input' && element.checkValidity()) {
      doNotify();
    } else if (type == 'change' && !element.checkValidity()) {
      element.value = Math.max(min, Math.min(max, Number(element.value)));
      doNotify();
    }
  };
  element.addEventListener('change', onChange);
  element.addEventListener('input', onChange);
}


function $(selector, base = document) {
  // we have ids with . like #manage.onlyEnabled which looks like #id.class
  // so since getElementById is superfast we'll try it anyway
  const byId = selector.startsWith('#') && document.getElementById(selector.slice(1));
  return byId || base.querySelector(selector);
}


function $$(selector, base = document) {
  return [...base.querySelectorAll(selector)];
}


function $element(opt) {
  // tag:              string, default 'div', may include namespace like 'ns#tag'
  // appendChild:      element or an array of elements
  // dataset:          object
  // any DOM property: assigned as is
  const [ns, tag] = opt.tag && opt.tag.includes('#')
    ? opt.tag.split('#')
    : [null, opt.tag];
  const element = ns
    ? document.createElementNS(ns == 'SVG' || ns == 'svg' ? 'http://www.w3.org/2000/svg' : ns, tag)
    : document.createElement(tag || 'div');
  (opt.appendChild instanceof Array ? opt.appendChild : [opt.appendChild])
    .forEach(child => child && element.appendChild(child));
  delete opt.appendChild;
  delete opt.tag;
  if (opt.dataset) {
    Object.assign(element.dataset, opt.dataset);
    delete opt.dataset;
  }
  if (ns) {
    for (const attr in opt) {
      element.setAttributeNS(null, attr, opt[attr]);
    }
  } else {
    Object.assign(element, opt);
  }
  return element;
}
