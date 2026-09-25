import { MetaFlowJson, MetaFlowScreen, MetaFlowComponent, FlowValidationError, FlowComponentType } from './types';
import { FlowFieldItem } from '@/lib/whatsappFlowsApi';

export function validateMetaFlowJson(jsonString: string): FlowValidationError[] {
  const errors: FlowValidationError[] = [];
  if (!jsonString || !jsonString.trim()) {
    errors.push({
      type: 'error',
      message: 'Flow JSON cannot be empty',
      rule: 'JSON_SYNTAX',
    });
    return errors;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    // Extract line number if present in error message
    const match = err.message.match(/position (\d+)/i) || err.message.match(/line (\d+)/i);
    let lineNum: number | undefined;
    if (match) {
      const pos = parseInt(match[1], 10);
      const linesUpTo = jsonString.substring(0, pos).split('\n');
      lineNum = linesUpTo.length;
    }
    errors.push({
      line: lineNum,
      type: 'error',
      message: `Invalid JSON syntax: ${err.message}`,
      rule: 'JSON_SYNTAX',
    });
    return errors;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    errors.push({
      type: 'error',
      message: 'Flow definition must be a JSON object',
      rule: 'ROOT_OBJECT',
    });
    return errors;
  }

  // Version check
  if (!parsed.version) {
    errors.push({
      type: 'error',
      message: 'Missing required root property "version" (e.g. "7.0" or "6.0")',
      rule: 'VERSION_REQUIRED',
    });
  } else if (typeof parsed.version !== 'string') {
    errors.push({
      type: 'error',
      message: '"version" must be a string (e.g. "7.0")',
      rule: 'VERSION_TYPE',
    });
  }

  // Screens check
  if (!Array.isArray(parsed.screens)) {
    errors.push({
      type: 'error',
      message: 'Missing required root array "screens"',
      rule: 'SCREENS_ARRAY',
    });
    return errors;
  }

  if (parsed.screens.length === 0) {
    errors.push({
      type: 'error',
      message: 'Flow must have at least one screen in "screens"',
      rule: 'SCREENS_EMPTY',
    });
    return errors;
  }

  const screenIds = new Set<string>();
  let hasTerminalScreen = false;

  parsed.screens.forEach((screen: any, screenIdx: number) => {
    if (!screen || typeof screen !== 'object') {
      errors.push({
        type: 'error',
        message: `Screen at index ${screenIdx} is not a valid object`,
        rule: 'SCREEN_OBJECT',
      });
      return;
    }

    // Screen ID
    if (!screen.id || typeof screen.id !== 'string') {
      errors.push({
        type: 'error',
        message: `Screen at index ${screenIdx} is missing required "id" string`,
        rule: 'SCREEN_ID_REQUIRED',
      });
    } else {
      if (!/^[A-Z0-9_]+$/i.test(screen.id)) {
        errors.push({
          screenId: screen.id,
          type: 'warning',
          message: `Screen ID "${screen.id}" should only contain alphanumeric characters and underscores`,
          rule: 'SCREEN_ID_FORMAT',
        });
      }
      if (screenIds.has(screen.id)) {
        errors.push({
          screenId: screen.id,
          type: 'error',
          message: `Duplicate screen ID "${screen.id}". Screen IDs must be unique`,
          rule: 'SCREEN_ID_UNIQUE',
        });
      }
      screenIds.add(screen.id);
    }

    // Screen Title
    if (!screen.title || typeof screen.title !== 'string') {
      errors.push({
        screenId: screen.id,
        type: 'error',
        message: `Screen "${screen.id || screenIdx}" is missing required "title"`,
        rule: 'SCREEN_TITLE_REQUIRED',
      });
    }

    if (screen.terminal === true) {
      hasTerminalScreen = true;
    }

    // Layout
    if (!screen.layout || typeof screen.layout !== 'object') {
      errors.push({
        screenId: screen.id,
        type: 'error',
        message: `Screen "${screen.id}" must have a "layout" object`,
        rule: 'LAYOUT_REQUIRED',
      });
      return;
    }

    if (screen.layout.type !== 'SingleColumnLayout') {
      errors.push({
        screenId: screen.id,
        type: 'error',
        message: `Layout type must be "SingleColumnLayout", received "${screen.layout.type}"`,
        rule: 'LAYOUT_TYPE',
      });
    }

    if (!Array.isArray(screen.layout.children)) {
      errors.push({
        screenId: screen.id,
        type: 'error',
        message: `Screen "${screen.id}" layout.children must be an array`,
        rule: 'LAYOUT_CHILDREN',
      });
      return;
    }

    // Validate layout children / form components
    const componentNames = new Set<string>();

    const validateComponents = (components: any[]) => {
      components.forEach((comp: any) => {
        if (!comp || typeof comp !== 'object') return;

        if (comp.type === 'Form' && Array.isArray(comp.children)) {
          validateComponents(comp.children);
          return;
        }

        // Validate component types
        const validTypes = [
          'TextHeading', 'TextSubheading', 'TextBody', 'TextCaption',
          'TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup',
          'CheckboxGroup', 'DatePicker', 'OptIn', 'EmbeddedLink', 'Footer', 'Form'
        ];

        if (!validTypes.includes(comp.type)) {
          errors.push({
            screenId: screen.id,
            componentName: comp.name,
            type: 'error',
            message: `Unknown component type "${comp.type}" in screen "${screen.id}"`,
            rule: 'UNKNOWN_COMPONENT_TYPE',
          });
        }

        // Input field name uniqueness and validity
        if (['TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'DatePicker', 'OptIn'].includes(comp.type)) {
          if (!comp.name || typeof comp.name !== 'string') {
            errors.push({
              screenId: screen.id,
              type: 'error',
              message: `Component of type "${comp.type}" is missing required "name" property`,
              rule: 'FIELD_NAME_REQUIRED',
            });
          } else {
            if (componentNames.has(comp.name)) {
              errors.push({
                screenId: screen.id,
                componentName: comp.name,
                type: 'error',
                message: `Duplicate field name "${comp.name}" in screen "${screen.id}"`,
                rule: 'FIELD_NAME_UNIQUE',
              });
            }
            componentNames.add(comp.name);
          }

          if (!comp.label || typeof comp.label !== 'string') {
            errors.push({
              screenId: screen.id,
              componentName: comp.name,
              type: 'warning',
              message: `Field "${comp.name || comp.type}" should have a descriptive "label"`,
              rule: 'FIELD_LABEL_RECOMMENDED',
            });
          }
        }

        // Dropdown / Radio / Checkbox options check
        if (['Dropdown', 'RadioButtonsGroup', 'CheckboxGroup'].includes(comp.type)) {
          const ds = comp['data-source'];
          if (!Array.isArray(ds) || ds.length === 0) {
            errors.push({
              screenId: screen.id,
              componentName: comp.name,
              type: 'error',
              message: `Component "${comp.name || comp.type}" requires a non-empty "data-source" array`,
              rule: 'DATA_SOURCE_EMPTY',
            });
          } else {
            const optIds = new Set<string>();
            ds.forEach((opt: any, optIdx: number) => {
              if (!opt || typeof opt !== 'object' || !opt.id || !opt.title) {
                errors.push({
                  screenId: screen.id,
                  componentName: comp.name,
                  type: 'error',
                  message: `data-source item at index ${optIdx} must contain both "id" and "title"`,
                  rule: 'DATA_SOURCE_ITEM_INVALID',
                });
              } else if (optIds.has(opt.id)) {
                errors.push({
                  screenId: screen.id,
                  componentName: comp.name,
                  type: 'error',
                  message: `Duplicate data-source item id "${opt.id}" in component "${comp.name}"`,
                  rule: 'DATA_SOURCE_ID_UNIQUE',
                });
              } else {
                optIds.add(opt.id);
              }
            });
          }
        }

        // Footer action check
        if (comp.type === 'Footer') {
          const action = comp['on-click-action'];
          if (!action || typeof action !== 'object') {
            errors.push({
              screenId: screen.id,
              type: 'error',
              message: `Footer in screen "${screen.id}" is missing required "on-click-action"`,
              rule: 'FOOTER_ACTION_REQUIRED',
            });
          } else {
            if (!['navigate', 'complete', 'data_exchange'].includes(action.name)) {
              errors.push({
                screenId: screen.id,
                type: 'error',
                message: `Invalid action name "${action.name}". Allowed: "navigate", "complete", "data_exchange"`,
                rule: 'ACTION_NAME_INVALID',
              });
            }
            if (action.name === 'navigate') {
              if (!action.next || action.next.type !== 'screen' || !action.next.name) {
                errors.push({
                  screenId: screen.id,
                  type: 'error',
                  message: `Navigate action in screen "${screen.id}" must define next: { type: "screen", name: "TARGET_SCREEN" }`,
                  rule: 'NAVIGATE_TARGET_REQUIRED',
                });
              }
            }
          }
        }
      });
    };

    validateComponents(screen.layout.children);
  });

  // Cross-screen transition checks
  parsed.screens.forEach((screen: any) => {
    const checkTransitions = (components: any[]) => {
      components.forEach((comp: any) => {
        if (comp.type === 'Form' && Array.isArray(comp.children)) {
          checkTransitions(comp.children);
        }
        if (comp.type === 'Footer' && comp['on-click-action']?.name === 'navigate') {
          const targetScreen = comp['on-click-action']?.next?.name;
          if (targetScreen && !screenIds.has(targetScreen)) {
            errors.push({
              screenId: screen.id,
              type: 'error',
              message: `Screen "${screen.id}" attempts to navigate to non-existent screen "${targetScreen}"`,
              rule: 'ORPHAN_NAVIGATE_TARGET',
            });
          }
        }
      });
    };
    if (screen.layout?.children) {
      checkTransitions(screen.layout.children);
    }
  });

  if (!hasTerminalScreen) {
    errors.push({
      type: 'warning',
      message: 'At least one screen should be marked as "terminal: true" to conclude the user interaction',
      rule: 'TERMINAL_SCREEN_RECOMMENDED',
    });
  }

  return errors;
}

export function metaFlowJsonToScreens(jsonString: string): MetaFlowScreen[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && Array.isArray(parsed.screens)) {
      return parsed.screens;
    }
  } catch (e) {
    console.warn('Failed to parse Meta Flow JSON to screens', e);
  }
  return [createEmptyScreen('MAIN_SCREEN', 'Welcome', true)];
}

export function screensToMetaFlowJson(screens: MetaFlowScreen[], version: string = '7.0'): string {
  const root: MetaFlowJson = {
    version,
    screens: screens.map(s => ({
      id: s.id,
      title: s.title,
      data: s.data || {},
      ...(s.terminal !== undefined ? { terminal: s.terminal } : {}),
      ...(s.success !== undefined ? { success: s.success } : {}),
      layout: {
        type: 'SingleColumnLayout',
        children: s.layout.children || []
      }
    }))
  };

  return JSON.stringify(root, null, 2);
}

export function convertSimpleFieldsToScreens(fields: FlowFieldItem[], flowTitle: string, description?: string): MetaFlowScreen[] {
  const formChildren: MetaFlowComponent[] = [];

  if (flowTitle) {
    formChildren.push({
      type: 'TextHeading',
      text: flowTitle,
    });
  }

  if (description) {
    formChildren.push({
      type: 'TextBody',
      text: description,
    });
  }

  const payload: Record<string, string> = {};

  fields.forEach(f => {
    const fieldName = f.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    payload[fieldName] = `\${form.${fieldName}}`;

    switch (f.type) {
      case 'EMAIL':
        formChildren.push({
          type: 'TextInput',
          name: fieldName,
          label: f.label,
          required: f.required,
          'input-type': 'email'
        });
        break;
      case 'PHONE':
        formChildren.push({
          type: 'TextInput',
          name: fieldName,
          label: f.label,
          required: f.required,
          'input-type': 'phone'
        });
        break;
      case 'NUMBER':
        formChildren.push({
          type: 'TextInput',
          name: fieldName,
          label: f.label,
          required: f.required,
          'input-type': 'number'
        });
        break;
      case 'DATE':
        formChildren.push({
          type: 'DatePicker',
          name: fieldName,
          label: f.label,
          required: f.required,
        });
        break;
      case 'SELECT':
        formChildren.push({
          type: 'Dropdown',
          name: fieldName,
          label: f.label,
          required: f.required,
          'data-source': (f.options && f.options.length > 0)
            ? f.options.map(opt => ({ id: opt.toLowerCase().replace(/[^a-z0-9_]/g, '_'), title: opt }))
            : [{ id: 'opt_1', title: 'Option 1' }]
        });
        break;
      case 'RADIO':
        formChildren.push({
          type: 'RadioButtonsGroup',
          name: fieldName,
          label: f.label,
          required: f.required,
          'data-source': (f.options && f.options.length > 0)
            ? f.options.map(opt => ({ id: opt.toLowerCase().replace(/[^a-z0-9_]/g, '_'), title: opt }))
            : [{ id: 'opt_1', title: 'Option 1' }]
        });
        break;
      case 'CHECKBOX':
        formChildren.push({
          type: 'CheckboxGroup',
          name: fieldName,
          label: f.label,
          required: f.required,
          'data-source': (f.options && f.options.length > 0)
            ? f.options.map(opt => ({ id: opt.toLowerCase().replace(/[^a-z0-9_]/g, '_'), title: opt }))
            : [{ id: 'opt_1', title: 'Option 1' }]
        });
        break;
      case 'TEXTAREA':
        formChildren.push({
          type: 'TextArea',
          name: fieldName,
          label: f.label,
          required: f.required,
        });
        break;
      default:
        formChildren.push({
          type: 'TextInput',
          name: fieldName,
          label: f.label,
          required: f.required,
          'input-type': 'text'
        });
        break;
    }
  });

  // Add Submit Footer
  formChildren.push({
    type: 'Footer',
    label: 'Submit',
    'on-click-action': {
      name: 'complete',
      payload
    }
  });

  return [
    {
      id: 'MAIN_SCREEN',
      title: flowTitle || 'Form',
      data: {},
      terminal: true,
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'Form',
            name: 'main_form',
            children: formChildren
          }
        ]
      }
    }
  ];
}

export function convertScreensToSimpleFields(screens: MetaFlowScreen[]): FlowFieldItem[] {
  const fields: FlowFieldItem[] = [];

  const extractFromComponents = (comps: MetaFlowComponent[]) => {
    comps.forEach(c => {
      if (c.type === 'Form' && Array.isArray(c.children)) {
        extractFromComponents(c.children);
        return;
      }

      if (['TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'DatePicker', 'OptIn'].includes(c.type)) {
        let fieldType: FlowFieldItem['type'] = 'TEXT';
        if (c.type === 'TextInput') {
          if (c['input-type'] === 'email') fieldType = 'EMAIL';
          else if (c['input-type'] === 'phone') fieldType = 'PHONE';
          else if (c['input-type'] === 'number') fieldType = 'NUMBER';
        } else if (c.type === 'TextArea') {
          fieldType = 'TEXTAREA';
        } else if (c.type === 'DatePicker') {
          fieldType = 'DATE';
        } else if (c.type === 'Dropdown') {
          fieldType = 'SELECT';
        } else if (c.type === 'RadioButtonsGroup') {
          fieldType = 'RADIO';
        } else if (c.type === 'CheckboxGroup' || c.type === 'OptIn') {
          fieldType = 'CHECKBOX';
        }

        const options = c['data-source'] ? c['data-source'].map(ds => ds.title) : undefined;

        fields.push({
          name: c.name || `field_${fields.length + 1}`,
          label: c.label || c.text || c.name || 'Field',
          type: fieldType,
          required: c.required ?? false,
          options
        });
      }
    });
  };

  screens.forEach(s => {
    if (s.layout?.children) {
      extractFromComponents(s.layout.children);
    }
  });

  return fields;
}

export function createEmptyScreen(id: string, title: string, isTerminal: boolean = false): MetaFlowScreen {
  return {
    id: id.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
    title: title || 'New Screen',
    data: {},
    terminal: isTerminal,
    layout: {
      type: 'SingleColumnLayout',
      children: [
        {
          type: 'Form',
          name: `${id.toLowerCase()}_form`,
          children: [
            {
              type: 'TextHeading',
              text: title || 'New Screen Heading'
            },
            {
              type: 'TextBody',
              text: 'Please complete the details below.'
            },
            {
              type: 'TextInput',
              name: 'full_name',
              label: 'Your Name',
              required: true,
              'input-type': 'text'
            },
            {
              type: 'Footer',
              label: isTerminal ? 'Submit' : 'Continue',
              'on-click-action': {
                name: isTerminal ? 'complete' : 'navigate',
                ...(isTerminal ? { payload: { full_name: '${form.full_name}' } } : { next: { type: 'screen', name: 'MAIN_SCREEN' } })
              }
            }
          ]
        }
      ]
    }
  };
}

export function createDefaultComponent(type: FlowComponentType): MetaFlowComponent {
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  switch (type) {
    case 'TextHeading':
      return { type: 'TextHeading', text: 'Section Heading' };
    case 'TextSubheading':
      return { type: 'TextSubheading', text: 'Subheading Details' };
    case 'TextBody':
      return { type: 'TextBody', text: 'Provide brief instructions for the customer.' };
    case 'TextCaption':
      return { type: 'TextCaption', text: 'Note: Information submitted is encrypted.' };
    case 'TextInput':
      return {
        type: 'TextInput',
        name: `field_${randomSuffix}`,
        label: 'Text Field',
        required: true,
        'input-type': 'text',
        'helper-text': ''
      };
    case 'TextArea':
      return {
        type: 'TextArea',
        name: `notes_${randomSuffix}`,
        label: 'Additional Notes / Comments',
        required: false,
        'max-chars': 500
      };
    case 'Dropdown':
      return {
        type: 'Dropdown',
        name: `select_${randomSuffix}`,
        label: 'Select Option',
        required: true,
        'data-source': [
          { id: 'opt_1', title: 'Option 1' },
          { id: 'opt_2', title: 'Option 2' },
          { id: 'opt_3', title: 'Option 3' }
        ]
      };
    case 'RadioButtonsGroup':
      return {
        type: 'RadioButtonsGroup',
        name: `choice_${randomSuffix}`,
        label: 'Choose One',
        required: true,
        'data-source': [
          { id: 'choice_a', title: 'Option A' },
          { id: 'choice_b', title: 'Option B' }
        ]
      };
    case 'CheckboxGroup':
      return {
        type: 'CheckboxGroup',
        name: `checkbox_${randomSuffix}`,
        label: 'Select all that apply',
        required: false,
        'data-source': [
          { id: 'feature_1', title: 'Feature 1' },
          { id: 'feature_2', title: 'Feature 2' }
        ]
      };
    case 'DatePicker':
      return {
        type: 'DatePicker',
        name: `date_${randomSuffix}`,
        label: 'Select Date',
        required: true
      };
    case 'OptIn':
      return {
        type: 'OptIn',
        name: `optin_${randomSuffix}`,
        label: 'I agree to the terms and privacy policy',
        required: true
      };
    case 'EmbeddedLink':
      return {
        type: 'EmbeddedLink',
        text: 'Learn more about terms',
        url: 'https://example.com'
      };
    case 'Footer':
      return {
        type: 'Footer',
        label: 'Continue',
        'on-click-action': {
          name: 'complete',
          payload: {}
        }
      };
    default:
      return {
        type: 'TextInput',
        name: `input_${randomSuffix}`,
        label: 'Input Field',
        required: true,
        'input-type': 'text'
      };
  }
}
