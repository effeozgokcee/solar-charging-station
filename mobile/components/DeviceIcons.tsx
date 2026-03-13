import React, { memo } from "react";
import Svg, { Circle, Rect, Line as SvgLine, G, Path } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

function PhoneIcon({ size = 28, color = "rgba(235,235,245,0.7)" }: IconProps) {
  const s = size / 28;
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x={8} y={2} width={12} height={24} rx={2.5} fill="none" stroke={color} strokeWidth={1.5} />
      <Circle cx={14} cy={22} r={1.5} fill={color} />
      <SvgLine x1={11} y1={5} x2={17} y2={5} stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

function EarbudsIcon({ size = 28, color = "rgba(235,235,245,0.7)" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx={8} cy={10} r={4} fill="none" stroke={color} strokeWidth={1.5} />
      <Circle cx={20} cy={10} r={4} fill="none" stroke={color} strokeWidth={1.5} />
      <SvgLine x1={8} y1={14} x2={8} y2={22} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <SvgLine x1={20} y1={14} x2={20} y2={22} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M 8 6 Q 14 -2 20 6" fill="none" stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

function TabletIcon({ size = 28, color = "rgba(235,235,245,0.7)" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x={4} y={2} width={20} height={24} rx={2.5} fill="none" stroke={color} strokeWidth={1.5} />
      <Circle cx={14} cy={22} r={1.5} fill={color} />
      <SvgLine x1={10} y1={5} x2={18} y2={5} stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

function WatchIcon({ size = 28, color = "rgba(235,235,245,0.7)" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Rect x={7} y={6} width={14} height={16} rx={3} fill="none" stroke={color} strokeWidth={1.5} />
      <Rect x={10} y={2} width={8} height={4} rx={1} fill={color} opacity={0.4} />
      <Rect x={10} y={22} width={8} height={4} rx={1} fill={color} opacity={0.4} />
      <Circle cx={14} cy={14} r={3} fill="none" stroke={color} strokeWidth={1} />
      <SvgLine x1={14} y1={12} x2={14} y2={14} stroke={color} strokeWidth={1} strokeLinecap="round" />
      <SvgLine x1={14} y1={14} x2={16} y2={14} stroke={color} strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

function SpeakerIcon({ size = 28, color = "rgba(235,235,245,0.7)" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx={14} cy={14} r={11} fill="none" stroke={color} strokeWidth={1.5} />
      <Circle cx={14} cy={14} r={7} fill="none" stroke={color} strokeWidth={1} />
      <Circle cx={14} cy={14} r={2.5} fill={color} />
    </Svg>
  );
}

function NoneIcon({ size = 28, color = "rgba(235,235,245,0.7)" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28">
      <Circle cx={14} cy={14} r={10} fill="none" stroke={color} strokeWidth={1.5} />
      <SvgLine x1={7} y1={21} x2={21} y2={7} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export const DEVICE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  none: NoneIcon,
  phone: PhoneIcon,
  earbuds: EarbudsIcon,
  tablet: TabletIcon,
  smartwatch: WatchIcon,
  speaker: SpeakerIcon,
};

export interface DeviceType {
  id: string;
  label: string;
  watts: number;
}

export const DEVICES: DeviceType[] = [
  { id: "none", label: "No Device", watts: 0 },
  { id: "phone", label: "Phone", watts: 5 },
  { id: "earbuds", label: "Earbuds", watts: 2.5 },
  { id: "tablet", label: "Tablet", watts: 10 },
  { id: "smartwatch", label: "Watch", watts: 1.5 },
  { id: "speaker", label: "Speaker", watts: 8 },
];

export { PhoneIcon, EarbudsIcon, TabletIcon, WatchIcon, SpeakerIcon, NoneIcon };
