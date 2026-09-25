export type FlowComponentType =
  | 'Form'
  | 'TextHeading'
  | 'TextSubheading'
  | 'TextBody'
  | 'TextCaption'
  | 'TextInput'
  | 'TextArea'
  | 'Dropdown'
  | 'RadioButtonsGroup'
  | 'CheckboxGroup'
  | 'DatePicker'
  | 'OptIn'
  | 'EmbeddedLink'
  | 'Footer';

export type FlowInputType = 'text' | 'email' | 'phone' | 'number' | 'password';

export interface FlowDataSourceItem {
  id: string;
  title: string;
  description?: string;
  metadata?: string;
}

export interface FlowOnClickAction {
  name: 'navigate' | 'complete' | 'data_exchange';
  next?: {
    type: 'screen';
    name: string;
  };
  payload?: Record<string, any>;
}

export interface MetaFlowComponent {
  id?: string;
  type: FlowComponentType;
  name?: string;
  text?: string;
  label?: string;
  required?: boolean;
  'input-type'?: FlowInputType;
  'helper-text'?: string;
  'error-text'?: string;
  'data-source'?: FlowDataSourceItem[];
  'max-chars'?: number;
  'min-chars'?: number;
  'on-click-action'?: FlowOnClickAction;
  url?: string;
  children?: MetaFlowComponent[];
  [key: string]: any;
}

export interface MetaFlowScreen {
  id: string;
  title: string;
  data?: Record<string, any>;
  terminal?: boolean;
  success?: boolean;
  layout: {
    type: 'SingleColumnLayout';
    children: MetaFlowComponent[];
  };
}

export interface MetaFlowJson {
  version: string;
  data_api_version?: string;
  routing_model?: Record<string, string[]>;
  screens: MetaFlowScreen[];
}

export interface FlowValidationError {
  line?: number;
  screenId?: string;
  componentName?: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
}

export interface FlowActionLog {
  id: string;
  timestamp: string;
  type: 'NAVIGATE' | 'COMPLETE' | 'VALIDATION' | 'DATA_EXCHANGE' | 'ERROR';
  sourceScreen?: string;
  targetScreen?: string;
  payload?: any;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
}
