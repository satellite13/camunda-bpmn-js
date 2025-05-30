/* global require */

export * from 'bpmn-js/test/helper';

export {
  createCanvasEvent,
  createEvent
} from 'bpmn-js/test/util/MockEvents';

import {
  attr as domAttr,
  query as domQuery,
  queryAll as domQueryAll
} from 'min-dom';

import {
  bootstrapBpmnJS,
  getBpmnJS,
  insertCSS
} from 'bpmn-js/test/helper';

import fileDrop from 'file-drops';

import download from 'downloadjs';

import CamundaCloudModeler from '../lib/camunda-cloud/Modeler';
import CamundaPlatformModeler from '../lib/camunda-platform/Modeler';

insertCSS(
  'diagram.css',
  require('bpmn-js/dist/assets/diagram-js.css').default
);

insertCSS(
  'bpmn-js.css',
  require('bpmn-js/dist/assets/bpmn-js.css').default
);

insertCSS(
  'bpmn-font.css',
  require('bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css').default
);

insertCSS(
  'minimap.css',
  require('diagram-js-minimap/assets/diagram-js-minimap.css').default
);

export function bootstrapCamundaCloudModeler(diagram, options, locals) {
  return bootstrapBpmnJS(CamundaCloudModeler, diagram, options, locals);
}

export function bootstrapCamundaPlatformModeler(diagram, options, locals) {
  return bootstrapBpmnJS(CamundaPlatformModeler, diagram, options, locals);
}

/**
 * Triggers a change event
 *
 * @param element on which the change should be triggered
 * @param eventType type of the event (e.g. click, change, ...)
 */
export function triggerEvent(element, eventType) {

  let evt;

  eventType = eventType || 'change';

  if (document.createEvent) {
    try {

      // Chrome, Safari, Firefox
      evt = new MouseEvent((eventType), {
        view: window,
        bubbles: true,
        cancelable: true
      });
    } catch (e) {

      // IE 11, PhantomJS (wat!)
      evt = document.createEvent('MouseEvent');

      evt.initEvent((eventType), true, true);
    }
    return element.dispatchEvent(evt);
  } else {

    // Welcome IE
    evt = document.createEventObject();

    return element.fireEvent('on' + eventType, evt);
  }
}

/**
 * Set the new value to the given element.
 *
 * @param element on which the change should be triggered
 * @param value new value for the element
 * @param eventType (optional) type of the event (e.g. click, change, ...)
 * @param cursorPosition (optional) position ot the cursor after changing
 *                                  the value
 */
export function triggerValue(element, value, eventType, cursorPosition) {
  if (typeof eventType == 'number') {
    cursorPosition = eventType;
    eventType = null;
  }

  element.focus();

  if (domAttr(element, 'contenteditable')) {
    element.innerText = value;
  } else {
    element.value = value;
  }

  if (cursorPosition) {
    element.selectionStart = cursorPosition;
    element.selectionEnd = cursorPosition;
  }

  triggerEvent(element, eventType);
}

export function triggerInput(element, value) {
  element.value = value;

  triggerEvent(element, 'input');

  element.focus();
}

export function triggerKeyEvent(element, event, code) {
  let e = document.createEvent('Events');

  if (e.initEvent) {
    e.initEvent(event, true, true);
  }

  e.keyCode = code;
  e.which = code;

  element.dispatchEvent(e);
}


/**
 * Select a form field with the specified index in the DOM
 *
 * @param  {number} index
 * @param  {DOMElement} container
 */
export function triggerFormFieldSelection(index, container) {
  let formFieldSelectBox = domQuery(
    'select[name=selectedExtensionElement]',
    container
  );

  formFieldSelectBox.options[index].selected = 'selected';
  triggerEvent(formFieldSelectBox, 'change');
}

/**
 *  Select the option with the given value
 *
 *  @param element contains the options
 *  @param optionValue value which should be selected
 */
export function selectedByOption(element, optionValue) {

  const options = domQueryAll('option', element);

  for (let i = 0; i < options.length; i++) {

    const option = options[i];

    if (option.value === optionValue) {
      element.selectedIndex = i;
      break;
    }
  }
}

/**
 * PhantomJS Speciality
 * @param element
 * @returns {*}
 */
export function selectedByIndex(element) {
  if (!element) {
    return null;
  }

  return element.options[element.selectedIndex];
}

// be able to load files into running bpmn-js test cases
document.documentElement.addEventListener('dragover', fileDrop('Drop a BPMN diagram to open it in the currently active test.', function(files) {
  const bpmnJS = getBpmnJS();

  if (bpmnJS && files.length === 1) {
    bpmnJS.importXML(files[0].contents);
  }
}));

insertCSS('file-drops.css', `
  .drop-overlay .box {
    background: orange;
    border-radius: 3px;
    display: inline-block;
    font-family: sans-serif;
    padding: 4px 10px;
    position: fixed;
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
  }
`);

// be able to download diagrams using CTRL/CMD+S
document.addEventListener('keydown', function(event) {
  const bpmnJS = getBpmnJS();

  if (!bpmnJS) {
    return;
  }

  if (!(event.ctrlKey || event.metaKey) || event.code !== 'KeyS') {
    return;
  }

  event.preventDefault();

  bpmnJS.saveXML({ format: true }).then(function(result) {
    download(result.xml, 'test.bpmn', 'application/xml');
  });
});