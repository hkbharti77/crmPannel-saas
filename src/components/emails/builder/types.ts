export type EmailBlockType =
  | 'header'
  | 'hero'
  | 'text'
  | 'button'
  | 'image'
  | 'grid2'
  | 'divider'
  | 'spacer'
  | 'social'
  | 'footer';

export interface HeaderBlockData {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  alignment: 'left' | 'center' | 'right';
  bgColor: string;
  textColor: string;
}

export interface HeroBlockData {
  headline: string;
  subheadline?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  bgColor: string;
  textColor: string;
}

export interface TextBlockData {
  content: string; // Markdown or simple HTML
  fontSize: number;
  lineHeight: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ButtonBlockData {
  text: string;
  url: string;
  alignment: 'left' | 'center' | 'right';
  bgColor: string;
  textColor: string;
  borderRadius: number;
  fullWidth: boolean;
}

export interface ImageBlockData {
  imageUrl: string;
  alt: string;
  caption?: string;
  alignment: 'left' | 'center' | 'right';
  linkUrl?: string;
  maxWidth: number; // percentage or px
}

export interface Grid2BlockData {
  col1Title: string;
  col1Text: string;
  col1ButtonText?: string;
  col1ButtonUrl?: string;
  col2Title: string;
  col2Text: string;
  col2ButtonText?: string;
  col2ButtonUrl?: string;
  bgColor: string;
  textColor: string;
}

export interface DividerBlockData {
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  thickness: number;
  marginY: number;
}

export interface SpacerBlockData {
  height: number;
}

export interface SocialBlockData {
  twitterUrl?: string;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  alignment: 'left' | 'center' | 'right';
}

export interface FooterBlockData {
  companyName: string;
  address: string;
  unsubscribeNotice: string; // must contain {{unsubscribe_link}}
  textColor: string;
  bgColor: string;
}

export type BlockDataUnion =
  | HeaderBlockData
  | HeroBlockData
  | TextBlockData
  | ButtonBlockData
  | ImageBlockData
  | Grid2BlockData
  | DividerBlockData
  | SpacerBlockData
  | SocialBlockData
  | FooterBlockData;

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  data: BlockDataUnion;
}

export interface EmailCanvasSettings {
  maxWidth: number;
  canvasBg: string;
  bodyBg: string;
  fontFamily: string;
  defaultTextColor: string;
}

export interface EmailBuilderDocument {
  version: number;
  settings: EmailCanvasSettings;
  blocks: EmailBlock[];
}
