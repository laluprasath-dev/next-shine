import { createContext, ReactNode, useContext, useRef, useState } from "react";

export interface ContextTypes {
  isDrag: boolean;
  setDrag: any;
  muted: boolean;
  setMuted: any;
  videoRefs: HTMLVideoElement | null;
  scrollRef: HTMLDivElement | null;
  homeVideoMute: boolean;
  setHomeVideoMute: any;
}

const Context = createContext<ContextTypes | undefined>(undefined);

export const useMyContext = () => {
  const context = useContext(Context);
  return context;
};

export default function GlobalContext({ children }: { children: ReactNode }) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  let scrollRef = useRef<HTMLDivElement | null>(null);
  const [homeVideoMute, setHomeVideoMute] = useState(false);
  const [isDrag, setDrag] = useState(false);
  const [muted, setMuted] = useState(false);
  const values: ContextTypes = {
    isDrag,
    setDrag,
    setMuted,
    muted,
    scrollRef,
    homeVideoMute,
    setHomeVideoMute,
  };
  return <Context.Provider value={values}>{children}</Context.Provider>;
}
