'use client';

import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import { html as htmlLang } from '@codemirror/lang-html';
import { css as cssLang } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  html: string;
  setHtml: (val: string) => void;
  css: string;
  setCss: (val: string) => void;
  js: string;
  setJs: (val: string) => void;
  readOnly?: boolean;
}

type TabType = 'html' | 'css' | 'js';

const jsCompletions = [
  // Document
  { label: 'document.getElementById', detail: 'id', info: 'Returns element by ID' },
  { label: 'document.querySelector', detail: 'selector', info: 'Returns first matching element' },
  { label: 'document.querySelectorAll', detail: 'selector', info: 'Returns all matching elements' },
  { label: 'document.createElement', detail: 'tag', info: 'Creates a new HTML element' },
  { label: 'document.createTextNode', detail: 'text', info: 'Creates a text node' },
  { label: 'document.addEventListener', detail: 'event, handler', info: 'Adds event listener' },
  { label: 'document.removeEventListener', detail: 'event, handler', info: 'Removes event listener' },
  { label: 'document.body', detail: 'property', info: 'Returns the body element' },
  { label: 'document.head', detail: 'property', info: 'Returns the head element' },
  { label: 'document.title', detail: 'property', info: 'Gets/sets page title' },
  { label: 'document.URL', detail: 'property', info: 'Returns current URL' },
  { label: 'document.cookie', detail: 'property', info: 'Gets/sets cookies' },
  { label: 'document.domain', detail: 'property', info: 'Returns domain name' },
  { label: 'document.referrer', detail: 'property', info: 'Returns referring URL' },
  { label: 'document.forms', detail: 'property', info: 'Returns all forms' },
  { label: 'document.images', detail: 'property', info: 'Returns all images' },
  { label: 'document.links', detail: 'property', info: 'Returns all links' },
  { label: 'document.scripts', detail: 'property', info: 'Returns all scripts' },
  { label: 'document.documentElement', detail: 'property', info: 'Returns the root element' },
  { label: 'document.write', detail: 'text', info: 'Writes HTML to document' },
  { label: 'document.open', detail: '', info: 'Opens document for writing' },
  { label: 'document.close', detail: '', info: 'Closes document stream' },
  { label: 'document.getElementsByClassName', detail: 'class', info: 'Returns elements by class name' },
  { label: 'document.getElementsByTagName', detail: 'tag', info: 'Returns elements by tag name' },
  { label: 'document.getElementsByName', detail: 'name', info: 'Returns elements by name attribute' },
  { label: 'document.hasFocus', detail: '', info: 'Checks if document has focus' },
  { label: 'document.createDocumentFragment', detail: '', info: 'Creates a document fragment' },
  { label: 'document.createEvent', detail: 'type', info: 'Creates an event' },
  { label: 'document.defaultView', detail: 'property', info: 'Returns the window object' },

  // Element
  { label: 'element.innerHTML', detail: 'property', info: 'Gets/sets HTML content' },
  { label: 'element.textContent', detail: 'property', info: 'Gets/sets text content' },
  { label: 'element.innerText', detail: 'property', info: 'Gets/sets rendered text' },
  { label: 'element.classList', detail: 'property', info: 'Returns class list' },
  { label: 'element.className', detail: 'property', info: 'Gets/sets class attribute' },
  { label: 'element.id', detail: 'property', info: 'Gets/sets element ID' },
  { label: 'element.style', detail: 'property', info: 'Gets/sets inline styles' },
  { label: 'element.attributes', detail: 'property', info: 'Returns element attributes' },
  { label: 'element.children', detail: 'property', info: 'Returns child elements' },
  { label: 'element.childNodes', detail: 'property', info: 'Returns child nodes' },
  { label: 'element.firstChild', detail: 'property', info: 'Returns first child node' },
  { label: 'element.lastChild', detail: 'property', info: 'Returns last child node' },
  { label: 'element.firstElementChild', detail: 'property', info: 'Returns first child element' },
  { label: 'element.lastElementChild', detail: 'property', info: 'Returns last child element' },
  { label: 'element.parentElement', detail: 'property', info: 'Returns parent element' },
  { label: 'element.parentNode', detail: 'property', info: 'Returns parent node' },
  { label: 'element.nextSibling', detail: 'property', info: 'Returns next sibling node' },
  { label: 'element.previousSibling', detail: 'property', info: 'Returns previous sibling node' },
  { label: 'element.nextElementSibling', detail: 'property', info: 'Returns next sibling element' },
  { label: 'element.previousElementSibling', detail: 'property', info: 'Returns previous sibling element' },
  { label: 'element.tagName', detail: 'property', info: 'Returns element tag name' },
  { label: 'element.offsetHeight', detail: 'property', info: 'Returns element height' },
  { label: 'element.offsetWidth', detail: 'property', info: 'Returns element width' },
  { label: 'element.offsetTop', detail: 'property', info: 'Returns offset top' },
  { label: 'element.offsetLeft', detail: 'property', info: 'Returns offset left' },
  { label: 'element.clientHeight', detail: 'property', info: 'Returns client height' },
  { label: 'element.clientWidth', detail: 'property', info: 'Returns client width' },
  { label: 'element.scrollHeight', detail: 'property', info: 'Returns scroll height' },
  { label: 'element.scrollWidth', detail: 'property', info: 'Returns scroll width' },
  { label: 'element.scrollTop', detail: 'property', info: 'Gets/sets scroll top' },
  { label: 'element.scrollLeft', detail: 'property', info: 'Gets/sets scroll left' },
  { label: 'element.setAttribute', detail: 'name, value', info: 'Sets an attribute' },
  { label: 'element.getAttribute', detail: 'name', info: 'Gets an attribute value' },
  { label: 'element.removeAttribute', detail: 'name', info: 'Removes an attribute' },
  { label: 'element.hasAttribute', detail: 'name', info: 'Checks if attribute exists' },
  { label: 'element.addEventListener', detail: 'event, handler', info: 'Adds event listener' },
  { label: 'element.removeEventListener', detail: 'event, handler', info: 'Removes event listener' },
  { label: 'element.dispatchEvent', detail: 'event', info: 'Dispatches an event' },
  { label: 'element.closest', detail: 'selector', info: 'Returns closest matching ancestor' },
  { label: 'element.matches', detail: 'selector', info: 'Checks if element matches selector' },
  { label: 'element.querySelector', detail: 'selector', info: 'Returns first child matching selector' },
  { label: 'element.querySelectorAll', detail: 'selector', info: 'Returns all children matching selector' },
  { label: 'element.insertAdjacentHTML', detail: 'position, html', info: 'Inserts HTML at position' },
  { label: 'element.insertAdjacentElement', detail: 'position, el', info: 'Inserts element at position' },
  { label: 'element.insertAdjacentText', detail: 'position, text', info: 'Inserts text at position' },
  { label: 'element.appendChild', detail: 'child', info: 'Appends a child element' },
  { label: 'element.insertBefore', detail: 'new, ref', info: 'Inserts element before reference' },
  { label: 'element.removeChild', detail: 'child', info: 'Removes a child element' },
  { label: 'element.replaceChild', detail: 'new, old', info: 'Replaces a child element' },
  { label: 'element.cloneNode', detail: 'deep', info: 'Clones the element' },
  { label: 'element.remove', detail: '', info: 'Removes the element' },
  { label: 'element.replaceWith', detail: '...nodes', info: 'Replaces element with nodes' },
  { label: 'element.before', detail: '...nodes', info: 'Inserts nodes before element' },
  { label: 'element.after', detail: '...nodes', info: 'Inserts nodes after element' },
  { label: 'element.prepend', detail: '...nodes', info: 'Prepends nodes to element' },
  { label: 'element.append', detail: '...nodes', info: 'Appends nodes to element' },
  { label: 'element.focus', detail: '', info: 'Focuses the element' },
  { label: 'element.blur', detail: '', info: 'Removes focus from element' },
  { label: 'element.click', detail: '', info: 'Clicks the element' },
  { label: 'element.scrollIntoView', detail: 'align', info: 'Scrolls element into view' },
  { label: 'element.getBoundingClientRect', detail: '', info: 'Returns element bounding rect' },
  { label: 'element.contains', detail: 'child', info: 'Checks if element contains child' },
  { label: 'element.dataset', detail: 'property', info: 'Returns custom data attributes' },

  // Events
  { label: 'addEventListener', detail: 'event, handler', info: 'Adds event listener' },
  { label: 'removeEventListener', detail: 'event, handler', info: 'Removes event listener' },
  { label: 'dispatchEvent', detail: 'event', info: 'Dispatches an event' },
  { label: 'Event', detail: 'type, options', info: 'Creates a new Event' },
  { label: 'CustomEvent', detail: 'type, detail', info: 'Creates a new CustomEvent' },
  { label: 'event.preventDefault', detail: '', info: 'Prevents default action' },
  { label: 'event.stopPropagation', detail: '', info: 'Stops event propagation' },
  { label: 'event.stopImmediatePropagation', detail: '', info: 'Stops all propagation' },
  { label: 'event.target', detail: 'property', info: 'Returns the target element' },
  { label: 'event.currentTarget', detail: 'property', info: 'Returns current target' },
  { label: 'event.type', detail: 'property', info: 'Returns event type' },
  { label: 'event.key', detail: 'property', info: 'Returns pressed key' },
  { label: 'event.code', detail: 'property', info: 'Returns key code' },
  { label: 'event.clientX', detail: 'property', info: 'Returns mouse X position' },
  { label: 'event.clientY', detail: 'property', info: 'Returns mouse Y position' },

  // Window
  { label: 'window.innerWidth', detail: 'property', info: 'Returns window inner width' },
  { label: 'window.innerHeight', detail: 'property', info: 'Returns window inner height' },
  { label: 'window.outerWidth', detail: 'property', info: 'Returns window outer width' },
  { label: 'window.outerHeight', detail: 'property', info: 'Returns window outer height' },
  { label: 'window.scrollX', detail: 'property', info: 'Returns horizontal scroll position' },
  { label: 'window.scrollY', detail: 'property', info: 'Returns vertical scroll position' },
  { label: 'window.pageXOffset', detail: 'property', info: 'Returns horizontal scroll offset' },
  { label: 'window.pageYOffset', detail: 'property', info: 'Returns vertical scroll offset' },
  { label: 'window.location', detail: 'property', info: 'Returns location object' },
  { label: 'window.navigator', detail: 'property', info: 'Returns navigator object' },
  { label: 'window.history', detail: 'property', info: 'Returns history object' },
  { label: 'window.screen', detail: 'property', info: 'Returns screen object' },
  { label: 'window.localStorage', detail: 'property', info: 'Returns localStorage object' },
  { label: 'window.sessionStorage', detail: 'property', info: 'Returns sessionStorage object' },
  { label: 'window.console', detail: 'property', info: 'Returns console object' },
  { label: 'window.performance', detail: 'property', info: 'Returns performance object' },
  { label: 'window.fetch', detail: 'url, options', info: 'Makes HTTP requests' },
  { label: 'window.setTimeout', detail: 'fn, ms', info: 'Sets a timeout' },
  { label: 'window.setInterval', detail: 'fn, ms', info: 'Sets an interval' },
  { label: 'window.clearTimeout', detail: 'id', info: 'Clears a timeout' },
  { label: 'window.clearInterval', detail: 'id', info: 'Clears an interval' },
  { label: 'window.requestAnimationFrame', detail: 'callback', info: 'Requests animation frame' },
  { label: 'window.open', detail: 'url, target', info: 'Opens a new window' },
  { label: 'window.close', detail: '', info: 'Closes the window' },
  { label: 'window.print', detail: '', info: 'Prints the page' },
  { label: 'window.alert', detail: 'message', info: 'Shows an alert dialog' },
  { label: 'window.confirm', detail: 'message', info: 'Shows a confirm dialog' },
  { label: 'window.prompt', detail: 'message, default', info: 'Shows a prompt dialog' },
  { label: 'window.addEventListener', detail: 'event, handler', info: 'Adds event listener to window' },
  { label: 'window.removeEventListener', detail: 'event, handler', info: 'Removes event listener' },
  { label: 'window.matchMedia', detail: 'query', info: 'Returns media query list' },
  { label: 'window.scrollTo', detail: 'x, y', info: 'Scrolls to position' },
  { label: 'window.scrollBy', detail: 'x, y', info: 'Scrolls by offset' },
  { label: 'window.name', detail: 'property', info: 'Gets/sets window name' },
  { label: 'window.opener', detail: 'property', info: 'Returns opening window' },
  { label: 'window.parent', detail: 'property', info: 'Returns parent window' },
  { label: 'window.top', detail: 'property', info: 'Returns top window' },
  { label: 'window.self', detail: 'property', info: 'Returns window itself' },
  { label: 'window.frameElement', detail: 'property', info: 'Returns frame element' },
  { label: 'window.length', detail: 'property', info: 'Returns number of frames' },

  // Location
  { label: 'location.href', detail: 'property', info: 'Gets/sets full URL' },
  { label: 'location.protocol', detail: 'property', info: 'Returns protocol' },
  { label: 'location.host', detail: 'property', info: 'Returns hostname:port' },
  { label: 'location.hostname', detail: 'property', info: 'Returns hostname' },
  { label: 'location.port', detail: 'property', info: 'Returns port number' },
  { label: 'location.pathname', detail: 'property', info: 'Returns path' },
  { label: 'location.search', detail: 'property', info: 'Returns query string' },
  { label: 'location.hash', detail: 'property', info: 'Returns hash fragment' },
  { label: 'location.origin', detail: 'property', info: 'Returns origin' },
  { label: 'location.assign', detail: 'url', info: 'Navigates to URL' },
  { label: 'location.replace', detail: 'url', info: 'Replaces current URL' },
  { label: 'location.reload', detail: 'force', info: 'Reloads the page' },

  // History
  { label: 'history.back', detail: '', info: 'Goes back in history' },
  { label: 'history.forward', detail: '', info: 'Goes forward in history' },
  { label: 'history.go', detail: 'delta', info: 'Goes to history position' },
  { label: 'history.pushState', detail: 'state, title, url', info: 'Pushes state to history' },
  { label: 'history.replaceState', detail: 'state, title, url', info: 'Replaces current state' },
  { label: 'history.length', detail: 'property', info: 'Returns history length' },
  { label: 'history.state', detail: 'property', info: 'Returns current state' },

  // Navigator
  { label: 'navigator.userAgent', detail: 'property', info: 'Returns user agent string' },
  { label: 'navigator.platform', detail: 'property', info: 'Returns platform' },
  { label: 'navigator.language', detail: 'property', info: 'Returns browser language' },
  { label: 'navigator.languages', detail: 'property', info: 'Returns preferred languages' },
  { label: 'navigator.onLine', detail: 'property', info: 'Checks if online' },
  { label: 'navigator.cookieEnabled', detail: 'property', info: 'Checks if cookies enabled' },
  { label: 'navigator.geolocation', detail: 'property', info: 'Returns geolocation API' },
  { label: 'navigator.mediaDevices', detail: 'property', info: 'Returns media devices API' },
  { label: 'navigator.clipboard', detail: 'property', info: 'Returns clipboard API' },
  { label: 'navigator.serviceWorker', detail: 'property', info: 'Returns service worker API' },
  { label: 'navigator.sendBeacon', detail: 'url, data', info: 'Sends beacon request' },
  { label: 'navigator.vibrate', detail: 'pattern', info: 'Vibrates device' },
  { label: 'navigator.share', detail: 'data', info: 'Shares content' },

  // Screen
  { label: 'screen.width', detail: 'property', info: 'Returns screen width' },
  { label: 'screen.height', detail: 'property', info: 'Returns screen height' },
  { label: 'screen.availWidth', detail: 'property', info: 'Returns available width' },
  { label: 'screen.availHeight', detail: 'property', info: 'Returns available height' },
  { label: 'screen.colorDepth', detail: 'property', info: 'Returns color depth' },
  { label: 'screen.pixelDepth', detail: 'property', info: 'Returns pixel depth' },
  { label: 'screen.orientation', detail: 'property', info: 'Returns screen orientation' },

  // Storage
  { label: 'localStorage.getItem', detail: 'key', info: 'Gets item from storage' },
  { label: 'localStorage.setItem', detail: 'key, value', info: 'Sets item in storage' },
  { label: 'localStorage.removeItem', detail: 'key', info: 'Removes item from storage' },
  { label: 'localStorage.clear', detail: '', info: 'Clears all storage' },
  { label: 'localStorage.key', detail: 'index', info: 'Gets key by index' },
  { label: 'localStorage.length', detail: 'property', info: 'Returns storage length' },
  { label: 'sessionStorage.getItem', detail: 'key', info: 'Gets item from session storage' },
  { label: 'sessionStorage.setItem', detail: 'key, value', info: 'Sets item in session storage' },
  { label: 'sessionStorage.removeItem', detail: 'key', info: 'Removes item from session storage' },
  { label: 'sessionStorage.clear', detail: '', info: 'Clears all session storage' },

  // Console
  { label: 'console.log', detail: '...data', info: 'Logs to console' },
  { label: 'console.error', detail: '...data', info: 'Logs error to console' },
  { label: 'console.warn', detail: '...data', info: 'Logs warning to console' },
  { label: 'console.info', detail: '...data', info: 'Logs info to console' },
  { label: 'console.debug', detail: '...data', info: 'Logs debug to console' },
  { label: 'console.table', detail: 'data', info: 'Logs table to console' },
  { label: 'console.group', detail: 'label', info: 'Creates console group' },
  { label: 'console.groupEnd', detail: '', info: 'Ends console group' },
  { label: 'console.time', detail: 'label', info: 'Starts timer' },
  { label: 'console.timeEnd', detail: 'label', info: 'Ends timer' },
  { label: 'console.count', detail: 'label', info: 'Counts calls' },
  { label: 'console.clear', detail: '', info: 'Clears console' },
  { label: 'console.assert', detail: 'condition, msg', info: 'Asserts condition' },
  { label: 'console.trace', detail: '', info: 'Logs stack trace' },
  { label: 'console.dir', detail: 'object', info: 'Logs object properties' },

  // Fetch / XHR
  { label: 'fetch', detail: 'url, options', info: 'Makes HTTP requests' },
  { label: 'response.json', detail: '', info: 'Parses JSON response' },
  { label: 'response.text', detail: '', info: 'Returns text response' },
  { label: 'response.blob', detail: '', info: 'Returns blob response' },
  { label: 'response.formData', detail: '', info: 'Returns form data' },
  { label: 'response.arrayBuffer', detail: '', info: 'Returns array buffer' },
  { label: 'response.headers', detail: 'property', info: 'Returns response headers' },
  { label: 'response.status', detail: 'property', info: 'Returns status code' },
  { label: 'response.ok', detail: 'property', info: 'Checks if request succeeded' },
  { label: 'response.statusText', detail: 'property', info: 'Returns status text' },
  { label: 'response.url', detail: 'property', info: 'Returns response URL' },
  { label: 'response.redirected', detail: 'property', info: 'Checks if redirected' },
  { label: 'response.clone', detail: '', info: 'Clones the response' },
  { label: 'Request', detail: 'url, options', info: 'Creates a Request object' },
  { label: 'Headers', detail: 'init', info: 'Creates Headers object' },
  { label: 'AbortController', detail: '', info: 'Creates abort controller' },
  { label: 'signal', detail: 'property', info: 'Returns abort signal' },

  // Promise / Async
  { label: 'Promise', detail: 'executor', info: 'Creates a Promise' },
  { label: 'Promise.resolve', detail: 'value', info: 'Creates resolved promise' },
  { label: 'Promise.reject', detail: 'reason', info: 'Creates rejected promise' },
  { label: 'Promise.all', detail: 'iterable', info: 'Waits for all promises' },
  { label: 'Promise.allSettled', detail: 'iterable', info: 'Waits for all to settle' },
  { label: 'Promise.race', detail: 'iterable', info: 'Returns first settled' },
  { label: 'Promise.any', detail: 'iterable', info: 'Returns first fulfilled' },
  { label: 'promise.then', detail: 'onFulfilled', info: 'Adds fulfillment handler' },
  { label: 'promise.catch', detail: 'onRejected', info: 'Adds rejection handler' },
  { label: 'promise.finally', detail: 'handler', info: 'Adds finally handler' },
  { label: 'async', detail: 'keyword', info: 'Declares async function' },
  { label: 'await', detail: 'keyword', info: 'Waits for promise' },

  // JSON
  { label: 'JSON.parse', detail: 'text', info: 'Parses JSON string' },
  { label: 'JSON.stringify', detail: 'value', info: 'Converts to JSON string' },

  // Math
  { label: 'Math.round', detail: 'x', info: 'Rounds to nearest integer' },
  { label: 'Math.floor', detail: 'x', info: 'Rounds down' },
  { label: 'Math.ceil', detail: 'x', info: 'Rounds up' },
  { label: 'Math.abs', detail: 'x', info: 'Returns absolute value' },
  { label: 'Math.max', detail: '...values', info: 'Returns maximum value' },
  { label: 'Math.min', detail: '...values', info: 'Returns minimum value' },
  { label: 'Math.random', detail: '', info: 'Returns random number 0-1' },
  { label: 'Math.pow', detail: 'base, exp', info: 'Raises to power' },
  { label: 'Math.sqrt', detail: 'x', info: 'Returns square root' },
  { label: 'Math.PI', detail: 'property', info: 'Returns PI value' },
  { label: 'Math.sin', detail: 'x', info: 'Returns sine' },
  { label: 'Math.cos', detail: 'x', info: 'Returns cosine' },
  { label: 'Math.floor(Math.random()', detail: 'pattern', info: 'Random integer pattern' },

  // Date
  { label: 'Date.now', detail: '', info: 'Returns current timestamp' },
  { label: 'new Date', detail: '', info: 'Creates new Date instance' },
  { label: 'date.getFullYear', detail: '', info: 'Returns year' },
  { label: 'date.getMonth', detail: '', info: 'Returns month (0-11)' },
  { label: 'date.getDate', detail: '', info: 'Returns day of month' },
  { label: 'date.getDay', detail: '', info: 'Returns day of week (0-6)' },
  { label: 'date.getHours', detail: '', info: 'Returns hours' },
  { label: 'date.getMinutes', detail: '', info: 'Returns minutes' },
  { label: 'date.getSeconds', detail: '', info: 'Returns seconds' },
  { label: 'date.getMilliseconds', detail: '', info: 'Returns milliseconds' },
  { label: 'date.toLocaleDateString', detail: '', info: 'Returns localized date' },
  { label: 'date.toLocaleTimeString', detail: '', info: 'Returns localized time' },
  { label: 'date.toISOString', detail: '', info: 'Returns ISO string' },
  { label: 'date.setFullYear', detail: 'year', info: 'Sets year' },
  { label: 'date.setMonth', detail: 'month', info: 'Sets month' },
  { label: 'date.setDate', detail: 'day', info: 'Sets day of month' },

  // Array
  { label: 'array.length', detail: 'property', info: 'Returns array length' },
  { label: 'array.map', detail: 'fn', info: 'Maps array elements' },
  { label: 'array.filter', detail: 'fn', info: 'Filters array elements' },
  { label: 'array.reduce', detail: 'fn, initial', info: 'Reduces array to value' },
  { label: 'array.forEach', detail: 'fn', info: 'Iterates array elements' },
  { label: 'array.find', detail: 'fn', info: 'Finds first matching element' },
  { label: 'array.findIndex', detail: 'fn', info: 'Finds index of element' },
  { label: 'array.some', detail: 'fn', info: 'Checks if any element matches' },
  { label: 'array.every', detail: 'fn', info: 'Checks if all elements match' },
  { label: 'array.includes', detail: 'value', info: 'Checks if array includes value' },
  { label: 'array.indexOf', detail: 'value', info: 'Returns first index of value' },
  { label: 'array.push', detail: '...items', info: 'Adds items to end' },
  { label: 'array.pop', detail: '', info: 'Removes last element' },
  { label: 'array.shift', detail: '', info: 'Removes first element' },
  { label: 'array.unshift', detail: '...items', info: 'Adds items to start' },
  { label: 'array.splice', detail: 'start, deleteCount', info: 'Removes/replaces elements' },
  { label: 'array.slice', detail: 'start, end', info: 'Returns a shallow copy' },
  { label: 'array.concat', detail: '...arrays', info: 'Concatenates arrays' },
  { label: 'array.join', detail: 'separator', info: 'Joins array to string' },
  { label: 'array.sort', detail: 'fn', info: 'Sorts the array' },
  { label: 'array.reverse', detail: '', info: 'Reverses the array' },
  { label: 'array.flat', detail: 'depth', info: 'Flattens nested arrays' },
  { label: 'array.flatMap', detail: 'fn', info: 'Maps and flattens' },
  { label: 'array.fill', detail: 'value, start, end', info: 'Fills array with value' },
  { label: 'array.from', detail: 'iterable', info: 'Creates array from iterable' },
  { label: 'array.of', detail: '...items', info: 'Creates array from arguments' },
  { label: 'Array.isArray', detail: 'value', info: 'Checks if value is array' },

  // String
  { label: 'string.length', detail: 'property', info: 'Returns string length' },
  { label: 'string.charAt', detail: 'index', info: 'Returns character at index' },
  { label: 'string.charCodeAt', detail: 'index', info: 'Returns character code' },
  { label: 'string.includes', detail: 'search', info: 'Checks if string includes' },
  { label: 'string.indexOf', detail: 'search', info: 'Returns index of first match' },
  { label: 'string.lastIndexOf', detail: 'search', info: 'Returns index of last match' },
  { label: 'string.startsWith', detail: 'search', info: 'Checks if string starts with' },
  { label: 'string.endsWith', detail: 'search', info: 'Checks if string ends with' },
  { label: 'string.slice', detail: 'start, end', info: 'Extracts a substring' },
  { label: 'string.substring', detail: 'start, end', info: 'Returns a substring' },
  { label: 'string.substr', detail: 'start, length', info: 'Returns substring by length' },
  { label: 'string.replace', detail: 'search, replacement', info: 'Replaces first match' },
  { label: 'string.replaceAll', detail: 'search, replacement', info: 'Replaces all matches' },
  { label: 'string.split', detail: 'separator', info: 'Splits string into array' },
  { label: 'string.toLowerCase', detail: '', info: 'Converts to lowercase' },
  { label: 'string.toUpperCase', detail: '', info: 'Converts to uppercase' },
  { label: 'string.trim', detail: '', info: 'Removes whitespace from ends' },
  { label: 'string.trimStart', detail: '', info: 'Removes leading whitespace' },
  { label: 'string.trimEnd', detail: '', info: 'Removes trailing whitespace' },
  { label: 'string.padStart', detail: 'length, pad', info: 'Pads start of string' },
  { label: 'string.padEnd', detail: 'length, pad', info: 'Pads end of string' },
  { label: 'string.repeat', detail: 'count', info: 'Repeats string' },
  { label: 'string.match', detail: 'regex', info: 'Matches against regex' },
  { label: 'string.matchAll', detail: 'regex', info: 'Returns all regex matches' },
  { label: 'string.search', detail: 'regex', info: 'Searches with regex' },
  { label: 'string.concat', detail: '...strings', info: 'Concatenates strings' },
  { label: 'string.localeCompare', detail: 'compare', info: 'Compares strings' },
  { label: 'string.at', detail: 'index', info: 'Returns character at index' },
  { label: 'template literal', detail: 'syntax', info: 'String template with ${}' },

  // Number / parseInt
  { label: 'parseInt', detail: 'string, radix', info: 'Parses string to integer' },
  { label: 'parseFloat', detail: 'string', info: 'Parses string to float' },
  { label: 'isNaN', detail: 'value', info: 'Checks if value is NaN' },
  { label: 'isFinite', detail: 'value', info: 'Checks if value is finite' },
  { label: 'Number.isInteger', detail: 'value', info: 'Checks if value is integer' },
  { label: 'number.toFixed', detail: 'digits', info: 'Formats number with decimals' },
  { label: 'number.toString', detail: 'radix', info: 'Converts number to string' },
  { label: 'Number', detail: 'value', info: 'Converts to number' },
  { label: 'Number.MAX_SAFE_INTEGER', detail: 'property', info: 'Max safe integer' },
  { label: 'Number.MIN_SAFE_INTEGER', detail: 'property', info: 'Min safe integer' },
  { label: 'Infinity', detail: 'property', info: 'Infinity value' },

  // typeof / operators
  { label: 'typeof', detail: 'operator', info: 'Returns type of value' },
  { label: 'instanceof', detail: 'operator', info: 'Checks if instance of class' },
  { label: 'new', detail: 'keyword', info: 'Creates new instance' },
  { label: 'delete', detail: 'operator', info: 'Deletes property' },
  { label: 'void', detail: 'operator', info: 'Evaluates to undefined' },
  { label: 'this', detail: 'keyword', info: 'Refers to current context' },
  { label: 'super', detail: 'keyword', info: 'Refers to parent class' },
  { label: 'class', detail: 'keyword', info: 'Declares a class' },
  { label: 'extends', detail: 'keyword', info: 'Extends a class' },
  { label: 'constructor', detail: 'method', info: 'Class constructor method' },
  { label: 'return', detail: 'keyword', info: 'Returns from function' },
  { label: 'throw', detail: 'keyword', info: 'Throws an error' },
  { label: 'try', detail: 'keyword', info: 'Starts try block' },
  { label: 'catch', detail: 'keyword', info: 'Catches error' },
  { label: 'finally', detail: 'keyword', info: 'Finally block' },
  { label: 'if', detail: 'keyword', info: 'Conditional statement' },
  { label: 'else', detail: 'keyword', info: 'Else clause' },
  { label: 'switch', detail: 'keyword', info: 'Switch statement' },
  { label: 'case', detail: 'keyword', info: 'Case clause' },
  { label: 'break', detail: 'keyword', info: 'Breaks out of loop' },
  { label: 'continue', detail: 'keyword', info: 'Continues loop' },
  { label: 'for', detail: 'keyword', info: 'For loop' },
  { label: 'while', detail: 'keyword', info: 'While loop' },
  { label: 'do', detail: 'keyword', info: 'Do-while loop' },
  { label: 'const', detail: 'keyword', info: 'Declares constant' },
  { label: 'let', detail: 'keyword', info: 'Declares variable' },
  { label: 'var', detail: 'keyword', info: 'Declares variable (legacy)' },
  { label: 'function', detail: 'keyword', info: 'Declares function' },
  { label: 'export', detail: 'keyword', info: 'Exports module' },
  { label: 'import', detail: 'keyword', info: 'Imports module' },
  { label: 'default', detail: 'keyword', info: 'Default export' },
  { label: 'from', detail: 'keyword', info: 'Import source' },
  { label: 'true', detail: 'literal', info: 'Boolean true' },
  { label: 'false', detail: 'literal', info: 'Boolean false' },
  { label: 'null', detail: 'literal', info: 'Null value' },
  { label: 'undefined', detail: 'literal', info: 'Undefined value' },
  { label: 'NaN', detail: 'property', info: 'Not a Number' },

  // Iteration helpers
  { label: 'for...of', detail: 'syntax', info: 'Iterates over iterable' },
  { label: 'for...in', detail: 'syntax', info: 'Iterates over keys' },
  { label: 'for await...of', detail: 'syntax', info: 'Async iteration' },
  { label: '...', detail: 'spread', info: 'Spread operator' },
  { label: '?.', detail: 'optional chaining', info: 'Optional chaining' },
  { label: '??', detail: 'nullish coalescing', info: 'Nullish coalescing' },
  { label: '||=', detail: 'logical OR assign', info: 'Logical OR assignment' },
  { label: '&&=', detail: 'logical AND assign', info: 'Logical AND assignment' },
  { label: '??=', detail: 'nullish assign', info: 'Nullish assignment' },
  { label: '=>', detail: 'arrow function', info: 'Arrow function syntax' },
  { label: '/* */', detail: 'comment', info: 'Multi-line comment' },
  { label: '//', detail: 'comment', info: 'Single-line comment' },

  // setTimeout / setInterval shorthand
  { label: 'setTimeout', detail: 'fn, ms', info: 'Calls function after delay' },
  { label: 'setInterval', detail: 'fn, ms', info: 'Calls function repeatedly' },
  { label: 'clearTimeout', detail: 'id', info: 'Cancels timeout' },
  { label: 'clearInterval', detail: 'id', info: 'Cancels interval' },

  // Error handling
  { label: 'Error', detail: 'message', info: 'Creates an Error' },
  { label: 'TypeError', detail: 'message', info: 'Creates a TypeError' },
  { label: 'SyntaxError', detail: 'message', info: 'Creates a SyntaxError' },
  { label: 'ReferenceError', detail: 'message', info: 'Creates a ReferenceError' },
  { label: 'RangeError', detail: 'message', info: 'Creates a RangeError' },

  // ClassList helpers
  { label: 'classList.add', detail: '...tokens', info: 'Adds classes' },
  { label: 'classList.remove', detail: '...tokens', info: 'Removes classes' },
  { label: 'classList.toggle', detail: 'token, force', info: 'Toggles class' },
  { label: 'classList.contains', detail: 'token', info: 'Checks if class exists' },
  { label: 'classList.replace', detail: 'old, new', info: 'Replaces class' },

  // Style properties
  { label: 'style.color', detail: 'property', info: 'Sets text color' },
  { label: 'style.backgroundColor', detail: 'property', info: 'Sets background color' },
  { label: 'style.fontSize', detail: 'property', info: 'Sets font size' },
  { label: 'style.fontWeight', detail: 'property', info: 'Sets font weight' },
  { label: 'style.display', detail: 'property', info: 'Sets display mode' },
  { label: 'style.position', detail: 'property', info: 'Sets position' },
  { label: 'style.width', detail: 'property', info: 'Sets width' },
  { label: 'style.height', detail: 'property', info: 'Sets height' },
  { label: 'style.margin', detail: 'property', info: 'Sets margin' },
  { label: 'style.padding', detail: 'property', info: 'Sets padding' },
  { label: 'style.border', detail: 'property', info: 'Sets border' },
  { label: 'style.opacity', detail: 'property', info: 'Sets opacity' },
  { label: 'style.transform', detail: 'property', info: 'Sets transform' },
  { label: 'style.transition', detail: 'property', info: 'Sets transition' },
  { label: 'style.visibility', detail: 'property', info: 'Sets visibility' },
  { label: 'style.zIndex', detail: 'property', info: 'Sets z-index' },
  { label: 'style.top', detail: 'property', info: 'Sets top position' },
  { label: 'style.left', detail: 'property', info: 'Sets left position' },
  { label: 'style.right', detail: 'property', info: 'Sets right position' },
  { label: 'style.bottom', detail: 'property', info: 'Sets bottom position' },
  { label: 'style.cursor', detail: 'property', info: 'Sets cursor style' },
  { label: 'style.overflow', detail: 'property', info: 'Sets overflow' },
  { label: 'style.boxShadow', detail: 'property', info: 'Sets box shadow' },
  { label: 'style.textAlign', detail: 'property', info: 'Sets text alignment' },
  { label: 'style.textDecoration', detail: 'property', info: 'Sets text decoration' },
  { label: 'style.maxWidth', detail: 'property', info: 'Sets max width' },
  { label: 'style.minWidth', detail: 'property', info: 'Sets min width' },
  { label: 'style.maxHeight', detail: 'property', info: 'Sets max height' },
  { label: 'style.minHeight', detail: 'property', info: 'Sets min height' },
  { label: 'style.background', detail: 'property', info: 'Sets background' },
  { label: 'style.backgroundImage', detail: 'property', info: 'Sets background image' },
  { label: 'style.borderRadius', detail: 'property', info: 'Sets border radius' },
  { label: 'style.flex', detail: 'property', info: 'Sets flex' },
  { label: 'style.flexDirection', detail: 'property', info: 'Sets flex direction' },
  { label: 'style.justifyContent', detail: 'property', info: 'Sets justify content' },
  { label: 'style.alignItems', detail: 'property', info: 'Sets align items' },
  { label: 'style.gap', detail: 'property', info: 'Sets gap' },
  { label: 'style.gridTemplateColumns', detail: 'property', info: 'Sets grid template' },
  { label: 'style.animation', detail: 'property', info: 'Sets animation' },
  { label: 'style.animationName', detail: 'property', info: 'Sets animation name' },
  { label: 'style.animationDuration', detail: 'property', info: 'Sets animation duration' },

  // IntersectionObserver
  { label: 'IntersectionObserver', detail: 'callback, options', info: 'Observes element visibility' },
  { label: 'MutationObserver', detail: 'callback', info: 'Observes DOM mutations' },
  { label: 'ResizeObserver', detail: 'callback', info: 'Observes element resize' },
  { label: 'observer.observe', detail: 'target', info: 'Starts observing' },
  { label: 'observer.unobserve', detail: 'target', info: 'Stops observing' },
  { label: 'observer.disconnect', detail: '', info: 'Disconnects observer' },

  // Canvas (basic)
  { label: 'canvas.getContext', detail: 'type', info: 'Gets canvas context' },
  { label: 'context.fillRect', detail: 'x, y, w, h', info: 'Fills rectangle' },
  { label: 'context.fillStyle', detail: 'property', info: 'Sets fill style' },
  { label: 'context.strokeStyle', detail: 'property', info: 'Sets stroke style' },
  { label: 'context.lineWidth', detail: 'property', info: 'Sets line width' },
  { label: 'context.font', detail: 'property', info: 'Sets font' },
  { label: 'context.fillText', detail: 'text, x, y', info: 'Fills text' },
  { label: 'context.beginPath', detail: '', info: 'Begins a path' },
  { label: 'context.arc', detail: 'x, y, r, start, end', info: 'Draws an arc' },
  { label: 'context.clearRect', detail: 'x, y, w, h', info: 'Clears rectangle' },
  { label: 'context.drawImage', detail: 'img, x, y', info: 'Draws an image' },

  // Web Audio
  { label: 'AudioContext', detail: '', info: 'Creates audio context' },
  { label: 'audioCtx.createOscillator', detail: '', info: 'Creates oscillator' },
  { label: 'audioCtx.createGain', detail: '', info: 'Creates gain node' },
  { label: 'audioCtx.createBufferSource', detail: '', info: 'Creates buffer source' },

  // Drag and Drop
  { label: 'dragstart', detail: 'event', info: 'Drag start event' },
  { label: 'dragend', detail: 'event', info: 'Drag end event' },
  { label: 'dragover', detail: 'event', info: 'Drag over event' },
  { label: 'dragenter', detail: 'event', info: 'Drag enter event' },
  { label: 'dragleave', detail: 'event', info: 'Drag leave event' },
  { label: 'drop', detail: 'event', info: 'Drop event' },
  { label: 'dataTransfer.setData', detail: 'format, data', info: 'Sets drag data' },
  { label: 'dataTransfer.getData', detail: 'format', info: 'Gets drag data' },

  // WebSocket
  { label: 'WebSocket', detail: 'url', info: 'Creates WebSocket connection' },
  { label: 'ws.onopen', detail: 'property', info: 'Connection opened' },
  { label: 'ws.onmessage', detail: 'property', info: 'Message received' },
  { label: 'ws.onclose', detail: 'property', info: 'Connection closed' },
  { label: 'ws.onerror', detail: 'property', info: 'Connection error' },
  { label: 'ws.send', detail: 'data', info: 'Sends data' },
  { label: 'ws.close', detail: '', info: 'Closes connection' },
  { label: 'ws.readyState', detail: 'property', info: 'Returns connection state' },

  // Service Worker
  { label: 'navigator.serviceWorker.register', detail: 'url', info: 'Registers service worker' },
  { label: 'registration.active', detail: 'property', info: 'Returns active worker' },
  { label: 'registration.waiting', detail: 'property', info: 'Returns waiting worker' },
  { label: 'registration.installing', detail: 'property', info: 'Returns installing worker' },

  // IndexedDB
  { label: 'indexedDB.open', detail: 'name, version', info: 'Opens IndexedDB database' },
  { label: 'db.createObjectStore', detail: 'name, options', info: 'Creates object store' },
  { label: 'db.transaction', detail: 'stores, mode', info: 'Creates transaction' },
  { label: 'store.put', detail: 'value, key', info: 'Puts value in store' },
  { label: 'store.get', detail: 'key', info: 'Gets value from store' },
  { label: 'store.delete', detail: 'key', info: 'Deletes value from store' },
  { label: 'store.getAll', detail: '', info: 'Gets all values' },
  { label: 'store.clear', detail: '', info: 'Clears store' },
  { label: 'transaction.objectStore', detail: 'name', info: 'Gets object store' },
  { label: 'request.onsuccess', detail: 'property', info: 'Request success handler' },
  { label: 'request.onerror', detail: 'property', info: 'Request error handler' },
  { label: 'request.result', detail: 'property', info: 'Request result' },
];

function jsCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[a-zA-Z_$][\w.$]*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  const query = word.text.toLowerCase();
  const options = jsCompletions
    .filter(c => c.label.toLowerCase().includes(query))
    .map(c => ({
      label: c.label,
      detail: c.detail,
      info: c.info,
      type: c.detail === 'keyword' ? 'keyword' :
            c.detail === 'property' ? 'property' :
            c.detail === 'operator' ? 'operator' :
            c.detail === 'literal' ? 'constant' :
            c.detail === 'comment' ? 'comment' :
            c.detail === 'syntax' ? 'snippet' :
            'function',
    }));

  if (options.length === 0) return null;

  return {
    from: word.from,
    options,
  };
}

export default function CodeEditor({ html, setHtml, css, setCss, js, setJs, readOnly = false }: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('html');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className={styles.editorContainer}><div className={styles.tabs}></div></div>;

  return (
    <div className={styles.editorContainer}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'html' ? styles.active : ''}`}
          onClick={() => setActiveTab('html')}
        >
          index.html
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'css' ? styles.active : ''}`}
          onClick={() => setActiveTab('css')}
        >
          style.css
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'js' ? styles.active : ''}`}
          onClick={() => setActiveTab('js')}
        >
          script.js
        </button>
      </div>

      <div className={styles.codeArea}>
        {activeTab === 'html' && (
          <CodeMirror
            value={html}
            height="100%"
            theme={oneDark}
            extensions={[htmlLang()]}
            onChange={(value) => setHtml(value)}
            className={styles.cmWrapper}
            readOnly={readOnly}
            editable={!readOnly}
          />
        )}
        {activeTab === 'css' && (
          <CodeMirror
            value={css}
            height="100%"
            theme={oneDark}
            extensions={[cssLang()]}
            onChange={(value) => setCss(value)}
            className={styles.cmWrapper}
            readOnly={readOnly}
            editable={!readOnly}
          />
        )}
        {activeTab === 'js' && (
          <CodeMirror
            value={js}
            height="100%"
            theme={oneDark}
            extensions={[
            javascript({ jsx: true, typescript: true }),
            javascriptLanguage.data.of({ autocomplete: jsCompletionSource }),
          ]}
            onChange={(value) => setJs(value)}
            className={styles.cmWrapper}
            readOnly={readOnly}
            editable={!readOnly}
          />
        )}
      </div>
    </div>
  );
}
