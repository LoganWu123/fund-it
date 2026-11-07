import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionConfig, useReducedMotion} from 'motion/react';
import {House, KeyRound, Handshake, ShieldCheck, MapPin, Landmark, Heart, Trees, Wallet, BadgeCheck, Compass, Building2} from 'lucide-react';
import {TextAnimate} from './components/ui/text-animate';
import {IconCloud} from './components/ui/icon-cloud';
import {Globe} from './components/ui/globe';
import type {COBEOptions} from 'cobe';

function Heading() {
  const reduced=useReducedMotion();
  return reduced ? <>Your next chapter.<br/>One good match at a time.</> : <MotionConfig reducedMotion="user"><TextAnimate as="span" animation="blurInUp" by="word" once duration={0.6}>Your next chapter.</TextAnimate><br/><TextAnimate as="span" animation="blurInUp" by="word" once duration={0.7} delay={0.15}>One good match at a time.</TextAnimate></MotionConfig>;
}
function Visible({view,children}:{view:string,children:React.ReactNode}) {
  const [visible,setVisible]=useState(!document.getElementById(view)?.classList.contains('hidden'));
  useEffect(()=>{const handler=(e:Event)=>setVisible((e as CustomEvent).detail===view);window.addEventListener('fundit:view',handler);return ()=>window.removeEventListener('fundit:view',handler);},[view]);
  return visible ? <>{children}</> : null;
}
function HousingCloud() {
  const icons=useMemo(()=>[House,KeyRound,Handshake,ShieldCheck,MapPin,Landmark,Heart,Trees,Wallet,BadgeCheck,Compass,Building2].map((Icon,i)=><Icon key={i} size={100} strokeWidth={1.5} color={['#54745e','#a78ab9','#b69655'][i%3]}/>),[]);
  return <IconCloud icons={icons}/>;
}
function HousingGlobe() {
  const [paused,setPaused]=useState(false);
  const config=useMemo<COBEOptions>(()=>({width:600,height:600,onRender:()=>{},devicePixelRatio:1.5,phi:4.3,theta:0.28,dark:0,diffuse:0.6,mapSamples:16000,mapBrightness:5,baseColor:[0.94,0.95,0.93],markerColor:[0.63,0.44,0.78],glowColor:[0.91,0.9,0.93],markers:[{location:[33.72,-117.83],size:0.06}],scale:1.05}),[]);
  return <><div className="globe-heading"><span className="globe-word" aria-hidden="true">Possibility.</span><button className="globe-pause" onClick={()=>setPaused(p=>!p)} aria-label={paused?'Play globe animation':'Pause globe animation'}>{paused?'▷':'Ⅱ'}</button></div><Globe paused={paused} config={config}/><span className="globe-caption">ORANGE COUNTY, CALIFORNIA<br/>33.72° N, 117.83° W</span></>;
}
const title=document.querySelector('#discoverAnimatedTitle');
if(title) createRoot(title).render(<Heading/>);
const cloud=document.querySelector('#funditIconCloud');
if(cloud) createRoot(cloud).render(<Visible view="discover"><HousingCloud/></Visible>);
const globe=document.querySelector('#funditGlobe');
if(globe) createRoot(globe).render(<Visible view="overview"><HousingGlobe/></Visible>);
