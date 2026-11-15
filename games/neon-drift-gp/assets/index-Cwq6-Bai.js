(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Uo="184",yu=0,gl=1,Mu=2,ws=1,Su=2,Ms=3,fi=0,Xe=1,xe=2,Xn=0,ji=1,wi=2,xl=3,vl=4,bu=5,yi=100,wu=101,Eu=102,Tu=103,Au=104,Cu=200,Ru=201,Pu=202,Lu=203,Fa=204,Oa=205,Iu=206,Du=207,Uu=208,Nu=209,Fu=210,Ou=211,ku=212,Bu=213,zu=214,ka=0,Ba=1,za=2,ns=3,Ga=4,Va=5,Ha=6,Wa=7,eh=0,Gu=1,Vu=2,An=0,nh=1,ih=2,sh=3,No=4,rh=5,ah=6,oh=7,lh=300,Ei=301,is=302,$r=303,qr=304,Gr=306,Ti=1e3,Hn=1001,Xa=1002,Fe=1003,Hu=1004,Xs=1005,We=1006,Yr=1007,Si=1008,sn=1009,ch=1010,hh=1011,Ps=1012,Fo=1013,Ln=1014,gn=1015,Yn=1016,Oo=1017,ko=1018,Ls=1020,uh=35902,dh=35899,fh=1021,ph=1022,xn=1023,Zn=1026,bi=1027,Bo=1028,zo=1029,Ai=1030,Go=1031,Vo=1033,Sr=33776,br=33777,wr=33778,Er=33779,$a=35840,qa=35841,Ya=35842,Za=35843,Ka=36196,Ja=37492,ja=37496,Qa=37488,to=37489,Pr=37490,eo=37491,no=37808,io=37809,so=37810,ro=37811,ao=37812,oo=37813,lo=37814,co=37815,ho=37816,uo=37817,fo=37818,po=37819,mo=37820,go=37821,xo=36492,vo=36494,_o=36495,yo=36283,Mo=36284,Lr=36285,So=36286,Wu=3200,bo=0,Xu=1,hi="",Re="srgb",Ir="srgb-linear",Dr="linear",he="srgb",Fi=7680,_l=519,$u=512,qu=513,Yu=514,Ho=515,Zu=516,Ku=517,Wo=518,Ju=519,yl=35044,mh=35048,Ml="300 es",En=2e3,Is=2001;function ju(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Ur(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Qu(){const i=Ur("canvas");return i.style.display="block",i}const Sl={};function bl(...i){const t="THREE."+i.shift();console.log(t,...i)}function gh(i){const t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ot(...i){i=gh(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function re(...i){i=gh(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function wo(...i){const t=i.join(" ");t in Sl||(Sl[t]=!0,Ot(...i))}function td(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const ed={[ka]:Ba,[za]:Ha,[Ga]:Wa,[ns]:Va,[Ba]:ka,[Ha]:za,[Wa]:Ga,[Va]:ns};class Ri{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const s=n[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const ze=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let wl=1234567;const Es=Math.PI/180,Ds=180/Math.PI;function Pi(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ze[i&255]+ze[i>>8&255]+ze[i>>16&255]+ze[i>>24&255]+"-"+ze[t&255]+ze[t>>8&255]+"-"+ze[t>>16&15|64]+ze[t>>24&255]+"-"+ze[e&63|128]+ze[e>>8&255]+"-"+ze[e>>16&255]+ze[e>>24&255]+ze[n&255]+ze[n>>8&255]+ze[n>>16&255]+ze[n>>24&255]).toLowerCase()}function Qt(i,t,e){return Math.max(t,Math.min(e,i))}function Xo(i,t){return(i%t+t)%t}function nd(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function id(i,t,e){return i!==t?(e-i)/(t-i):0}function Ts(i,t,e){return(1-e)*i+e*t}function sd(i,t,e,n){return Ts(i,t,1-Math.exp(-e*n))}function rd(i,t=1){return t-Math.abs(Xo(i,t*2)-t)}function ad(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function od(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function ld(i,t){return i+Math.floor(Math.random()*(t-i+1))}function cd(i,t){return i+Math.random()*(t-i)}function hd(i){return i*(.5-Math.random())}function ud(i){i!==void 0&&(wl=i);let t=wl+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function dd(i){return i*Es}function fd(i){return i*Ds}function pd(i){return(i&i-1)===0&&i!==0}function md(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function gd(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function xd(i,t,e,n,s){const r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+n)/2),h=a((t+n)/2),u=r((t-n)/2),d=a((t-n)/2),f=r((n-t)/2),p=a((n-t)/2);switch(s){case"XYX":i.set(o*h,l*u,l*d,o*c);break;case"YZY":i.set(l*d,o*h,l*u,o*c);break;case"ZXZ":i.set(l*u,l*d,o*h,o*c);break;case"XZX":i.set(o*h,l*p,l*f,o*c);break;case"YXY":i.set(l*f,o*h,l*p,o*c);break;case"ZYZ":i.set(l*p,l*f,o*h,o*c);break;default:Ot("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Ji(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function qe(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const ke={DEG2RAD:Es,RAD2DEG:Ds,generateUUID:Pi,clamp:Qt,euclideanModulo:Xo,mapLinear:nd,inverseLerp:id,lerp:Ts,damp:sd,pingpong:rd,smoothstep:ad,smootherstep:od,randInt:ld,randFloat:cd,randFloatSpread:hd,seededRandom:ud,degToRad:dd,radToDeg:fd,isPowerOfTwo:pd,ceilPowerOfTwo:md,floorPowerOfTwo:gd,setQuaternionFromProperEuler:xd,normalize:qe,denormalize:Ji};class ut{static{ut.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class un{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],d=r[a+0],f=r[a+1],p=r[a+2],x=r[a+3];if(u!==x||l!==d||c!==f||h!==p){let g=l*d+c*f+h*p+u*x;g<0&&(d=-d,f=-f,p=-p,x=-x,g=-g);let m=1-o;if(g<.9995){const v=Math.acos(g),M=Math.sin(v);m=Math.sin(m*v)/M,o=Math.sin(o*v)/M,l=l*m+d*o,c=c*m+f*o,h=h*m+p*o,u=u*m+x*o}else{l=l*m+d*o,c=c*m+f*o,h=h*m+p*o,u=u*m+x*o;const v=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=v,c*=v,h*=v,u*=v}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[a],d=r[a+1],f=r[a+2],p=r[a+3];return t[e]=o*p+h*u+l*f-c*d,t[e+1]=l*p+h*d+c*u-o*f,t[e+2]=c*p+h*f+o*d-l*u,t[e+3]=h*p-o*u-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),u=o(r/2),d=l(n/2),f=l(s/2),p=l(r/2);switch(a){case"XYZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"YXZ":this._x=d*h*u+c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"ZXY":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u-d*f*p;break;case"ZYX":this._x=d*h*u-c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u+d*f*p;break;case"YZX":this._x=d*h*u+c*f*p,this._y=c*f*u+d*h*p,this._z=c*h*p-d*f*u,this._w=c*h*u-d*f*p;break;case"XZY":this._x=d*h*u-c*f*p,this._y=c*f*u-d*h*p,this._z=c*h*p+d*f*u,this._w=c*h*u+d*f*p;break;default:Ot("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=n+o+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(n>o&&n>u){const f=2*Math.sqrt(1+n-o-u);this._w=(h-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>u){const f=2*Math.sqrt(1+o-n-u);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+u-n-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Qt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class A{static{A.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(El.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(El.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),u=2*(r*n-a*e);return this.x=e+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=s+l*u+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this.z=Qt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this.z=Qt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Zr.copy(this).projectOnVector(t),this.sub(Zr)}reflect(t){return this.sub(Zr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Zr=new A,El=new un;class qt{static{qt.prototype.isMatrix3=!0}constructor(t,e,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){const h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],p=n[8],x=s[0],g=s[3],m=s[6],v=s[1],M=s[4],S=s[7],R=s[2],E=s[5],P=s[8];return r[0]=a*x+o*v+l*R,r[3]=a*g+o*M+l*E,r[6]=a*m+o*S+l*P,r[1]=c*x+h*v+u*R,r[4]=c*g+h*M+u*E,r[7]=c*m+h*S+u*P,r[2]=d*x+f*v+p*R,r[5]=d*g+f*M+p*E,r[8]=d*m+f*S+p*P,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=h*a-o*c,d=o*l-h*r,f=c*r-a*l,p=e*u+n*d+s*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/p;return t[0]=u*x,t[1]=(s*c-h*n)*x,t[2]=(o*n-s*a)*x,t[3]=d*x,t[4]=(h*e-s*l)*x,t[5]=(s*r-o*e)*x,t[6]=f*x,t[7]=(n*l-c*e)*x,t[8]=(a*e-n*r)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Kr.makeScale(t,e)),this}rotate(t){return this.premultiply(Kr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Kr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Kr=new qt,Tl=new qt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Al=new qt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function vd(){const i={enabled:!0,workingColorSpace:Ir,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===he&&(s.r=$n(s.r),s.g=$n(s.g),s.b=$n(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===he&&(s.r=Qi(s.r),s.g=Qi(s.g),s.b=Qi(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===hi?Dr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return wo("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return wo("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ir]:{primaries:t,whitePoint:n,transfer:Dr,toXYZ:Tl,fromXYZ:Al,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Re},outputColorSpaceConfig:{drawingBufferColorSpace:Re}},[Re]:{primaries:t,whitePoint:n,transfer:he,toXYZ:Tl,fromXYZ:Al,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Re}}}),i}const se=vd();function $n(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Qi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Oi;class _d{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Oi===void 0&&(Oi=Ur("canvas")),Oi.width=t.width,Oi.height=t.height;const s=Oi.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=Oi}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ur("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=$n(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor($n(e[n]/255)*255):e[n]=$n(e[n]);return{data:e,width:t.width,height:t.height}}else return Ot("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let yd=0;class $o{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:yd++}),this.uuid=Pi(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Jr(s[a].image)):r.push(Jr(s[a]))}else r=Jr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Jr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?_d.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ot("Texture: Unable to serialize Texture."),{})}let Md=0;const jr=new A;class $e extends Ri{constructor(t=$e.DEFAULT_IMAGE,e=$e.DEFAULT_MAPPING,n=Hn,s=Hn,r=We,a=Si,o=xn,l=sn,c=$e.DEFAULT_ANISOTROPY,h=hi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Md++}),this.uuid=Pi(),this.name="",this.source=new $o(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ut(0,0),this.repeat=new ut(1,1),this.center=new ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new qt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(jr).x}get height(){return this.source.getSize(jr).y}get depth(){return this.source.getSize(jr).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){Ot(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Ot(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==lh)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ti:t.x=t.x-Math.floor(t.x);break;case Hn:t.x=t.x<0?0:1;break;case Xa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ti:t.y=t.y-Math.floor(t.y);break;case Hn:t.y=t.y<0?0:1;break;case Xa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}$e.DEFAULT_IMAGE=null;$e.DEFAULT_MAPPING=lh;$e.DEFAULT_ANISOTROPY=1;class Me{static{Me.prototype.isVector4=!0}constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],p=l[9],x=l[2],g=l[6],m=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(p-g)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(p+g)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const M=(c+1)/2,S=(f+1)/2,R=(m+1)/2,E=(h+d)/4,P=(u+x)/4,y=(p+g)/4;return M>S&&M>R?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=E/n,r=P/n):S>R?S<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(S),n=E/s,r=y/s):R<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(R),n=P/r,s=y/r),this.set(n,s,r,e),this}let v=Math.sqrt((g-p)*(g-p)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(v)<.001&&(v=1),this.x=(g-p)/v,this.y=(u-x)/v,this.z=(d-h)/v,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this.z=Qt(this.z,t.z,e.z),this.w=Qt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this.z=Qt(this.z,t,e),this.w=Qt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Sd extends Ri{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:We,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Me(0,0,t,e),this.scissorTest=!1,this.viewport=new Me(0,0,t,e),this.textures=[];const s={width:t,height:e,depth:n.depth},r=new $e(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){const e={minFilter:We,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const s=Object.assign({},t.textures[e].image);this.textures[e].source=new $o(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Cn extends Sd{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class xh extends $e{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Fe,this.minFilter=Fe,this.wrapR=Hn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class bd extends $e{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Fe,this.minFilter=Fe,this.wrapR=Hn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ee{static{ee.prototype.isMatrix4=!0}constructor(t,e,n,s,r,a,o,l,c,h,u,d,f,p,x,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,u,d,f,p,x,g)}set(t,e,n,s,r,a,o,l,c,h,u,d,f,p,x,g){const m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=u,m[14]=d,m[3]=f,m[7]=p,m[11]=x,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ee().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinant()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinant()===0)return this.identity();const e=this.elements,n=t.elements,s=1/ki.setFromMatrixColumn(t,0).length(),r=1/ki.setFromMatrixColumn(t,1).length(),a=1/ki.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){const d=a*h,f=a*u,p=o*h,x=o*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=f+p*c,e[5]=d-x*c,e[9]=-o*l,e[2]=x-d*c,e[6]=p+f*c,e[10]=a*l}else if(t.order==="YXZ"){const d=l*h,f=l*u,p=c*h,x=c*u;e[0]=d+x*o,e[4]=p*o-f,e[8]=a*c,e[1]=a*u,e[5]=a*h,e[9]=-o,e[2]=f*o-p,e[6]=x+d*o,e[10]=a*l}else if(t.order==="ZXY"){const d=l*h,f=l*u,p=c*h,x=c*u;e[0]=d-x*o,e[4]=-a*u,e[8]=p+f*o,e[1]=f+p*o,e[5]=a*h,e[9]=x-d*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const d=a*h,f=a*u,p=o*h,x=o*u;e[0]=l*h,e[4]=p*c-f,e[8]=d*c+x,e[1]=l*u,e[5]=x*c+d,e[9]=f*c-p,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const d=a*l,f=a*c,p=o*l,x=o*c;e[0]=l*h,e[4]=x-d*u,e[8]=p*u+f,e[1]=u,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=f*u+p,e[10]=d-x*u}else if(t.order==="XZY"){const d=a*l,f=a*c,p=o*l,x=o*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+x,e[5]=a*h,e[9]=f*u-p,e[2]=p*u-f,e[6]=o*h,e[10]=x*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(wd,t,Ed)}lookAt(t,e,n){const s=this.elements;return tn.subVectors(t,e),tn.lengthSq()===0&&(tn.z=1),tn.normalize(),ii.crossVectors(n,tn),ii.lengthSq()===0&&(Math.abs(n.z)===1?tn.x+=1e-4:tn.z+=1e-4,tn.normalize(),ii.crossVectors(n,tn)),ii.normalize(),$s.crossVectors(tn,ii),s[0]=ii.x,s[4]=$s.x,s[8]=tn.x,s[1]=ii.y,s[5]=$s.y,s[9]=tn.y,s[2]=ii.z,s[6]=$s.z,s[10]=tn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],p=n[2],x=n[6],g=n[10],m=n[14],v=n[3],M=n[7],S=n[11],R=n[15],E=s[0],P=s[4],y=s[8],T=s[12],I=s[1],C=s[5],N=s[9],H=s[13],W=s[2],D=s[6],B=s[10],k=s[14],J=s[3],et=s[7],dt=s[11],yt=s[15];return r[0]=a*E+o*I+l*W+c*J,r[4]=a*P+o*C+l*D+c*et,r[8]=a*y+o*N+l*B+c*dt,r[12]=a*T+o*H+l*k+c*yt,r[1]=h*E+u*I+d*W+f*J,r[5]=h*P+u*C+d*D+f*et,r[9]=h*y+u*N+d*B+f*dt,r[13]=h*T+u*H+d*k+f*yt,r[2]=p*E+x*I+g*W+m*J,r[6]=p*P+x*C+g*D+m*et,r[10]=p*y+x*N+g*B+m*dt,r[14]=p*T+x*H+g*k+m*yt,r[3]=v*E+M*I+S*W+R*J,r[7]=v*P+M*C+S*D+R*et,r[11]=v*y+M*N+S*B+R*dt,r[15]=v*T+M*H+S*k+R*yt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],f=t[14],p=t[3],x=t[7],g=t[11],m=t[15],v=l*f-c*d,M=o*f-c*u,S=o*d-l*u,R=a*f-c*h,E=a*d-l*h,P=a*u-o*h;return e*(x*v-g*M+m*S)-n*(p*v-g*R+m*E)+s*(p*M-x*R+m*P)-r*(p*S-x*E+g*P)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],f=t[11],p=t[12],x=t[13],g=t[14],m=t[15],v=e*o-n*a,M=e*l-s*a,S=e*c-r*a,R=n*l-s*o,E=n*c-r*o,P=s*c-r*l,y=h*x-u*p,T=h*g-d*p,I=h*m-f*p,C=u*g-d*x,N=u*m-f*x,H=d*m-f*g,W=v*H-M*N+S*C+R*I-E*T+P*y;if(W===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const D=1/W;return t[0]=(o*H-l*N+c*C)*D,t[1]=(s*N-n*H-r*C)*D,t[2]=(x*P-g*E+m*R)*D,t[3]=(d*E-u*P-f*R)*D,t[4]=(l*I-a*H-c*T)*D,t[5]=(e*H-s*I+r*T)*D,t[6]=(g*S-p*P-m*M)*D,t[7]=(h*P-d*S+f*M)*D,t[8]=(a*N-o*I+c*y)*D,t[9]=(n*I-e*N-r*y)*D,t[10]=(p*E-x*S+m*v)*D,t[11]=(u*S-h*E-f*v)*D,t[12]=(o*T-a*C-l*y)*D,t[13]=(e*C-n*T+s*y)*D,t[14]=(x*M-p*R-g*v)*D,t[15]=(h*R-u*M+d*v)*D,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,u=o+o,d=r*c,f=r*h,p=r*u,x=a*h,g=a*u,m=o*u,v=l*c,M=l*h,S=l*u,R=n.x,E=n.y,P=n.z;return s[0]=(1-(x+m))*R,s[1]=(f+S)*R,s[2]=(p-M)*R,s[3]=0,s[4]=(f-S)*E,s[5]=(1-(d+m))*E,s[6]=(g+v)*E,s[7]=0,s[8]=(p+M)*P,s[9]=(g-v)*P,s[10]=(1-(d+x))*P,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];const r=this.determinant();if(r===0)return n.set(1,1,1),e.identity(),this;let a=ki.set(s[0],s[1],s[2]).length();const o=ki.set(s[4],s[5],s[6]).length(),l=ki.set(s[8],s[9],s[10]).length();r<0&&(a=-a),dn.copy(this);const c=1/a,h=1/o,u=1/l;return dn.elements[0]*=c,dn.elements[1]*=c,dn.elements[2]*=c,dn.elements[4]*=h,dn.elements[5]*=h,dn.elements[6]*=h,dn.elements[8]*=u,dn.elements[9]*=u,dn.elements[10]*=u,e.setFromRotationMatrix(dn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=En,l=!1){const c=this.elements,h=2*r/(e-t),u=2*r/(n-s),d=(e+t)/(e-t),f=(n+s)/(n-s);let p,x;if(l)p=r/(a-r),x=a*r/(a-r);else if(o===En)p=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===Is)p=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=En,l=!1){const c=this.elements,h=2/(e-t),u=2/(n-s),d=-(e+t)/(e-t),f=-(n+s)/(n-s);let p,x;if(l)p=1/(a-r),x=a/(a-r);else if(o===En)p=-2/(a-r),x=-(a+r)/(a-r);else if(o===Is)p=-1/(a-r),x=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const ki=new A,dn=new ee,wd=new A(0,0,0),Ed=new A(1,1,1),ii=new A,$s=new A,tn=new A,Cl=new ee,Rl=new un;class je{constructor(t=0,e=0,n=0,s=je.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Qt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Qt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Qt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Qt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Qt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Qt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Ot("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Cl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Cl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Rl.setFromEuler(this),this.setFromQuaternion(Rl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}je.DEFAULT_ORDER="XYZ";class vh{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Td=0;const Pl=new A,Bi=new un,Un=new ee,qs=new A,hs=new A,Ad=new A,Cd=new un,Ll=new A(1,0,0),Il=new A(0,1,0),Dl=new A(0,0,1),Ul={type:"added"},Rd={type:"removed"},zi={type:"childadded",child:null},Qr={type:"childremoved",child:null};class Le extends Ri{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Td++}),this.uuid=Pi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Le.DEFAULT_UP.clone();const t=new A,e=new je,n=new un,s=new A(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ee},normalMatrix:{value:new qt}}),this.matrix=new ee,this.matrixWorld=new ee,this.matrixAutoUpdate=Le.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new vh,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Bi.setFromAxisAngle(t,e),this.quaternion.multiply(Bi),this}rotateOnWorldAxis(t,e){return Bi.setFromAxisAngle(t,e),this.quaternion.premultiply(Bi),this}rotateX(t){return this.rotateOnAxis(Ll,t)}rotateY(t){return this.rotateOnAxis(Il,t)}rotateZ(t){return this.rotateOnAxis(Dl,t)}translateOnAxis(t,e){return Pl.copy(t).applyQuaternion(this.quaternion),this.position.add(Pl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ll,t)}translateY(t){return this.translateOnAxis(Il,t)}translateZ(t){return this.translateOnAxis(Dl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Un.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?qs.copy(t):qs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),hs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Un.lookAt(hs,qs,this.up):Un.lookAt(qs,hs,this.up),this.quaternion.setFromRotationMatrix(Un),s&&(Un.extractRotation(s.matrixWorld),Bi.setFromRotationMatrix(Un),this.quaternion.premultiply(Bi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(re("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Ul),zi.child=t,this.dispatchEvent(zi),zi.child=null):re("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Rd),Qr.child=t,this.dispatchEvent(Qr),Qr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Un.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Un.multiply(t.parent.matrixWorld)),t.applyMatrix4(Un),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Ul),zi.child=t,this.dispatchEvent(zi),zi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hs,t,Ad),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hs,Cd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),u=a(t.shapes),d=a(t.skeletons),f=a(t.animations),p=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=s,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}Le.DEFAULT_UP=new A(0,1,0);Le.DEFAULT_MATRIX_AUTO_UPDATE=!0;Le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class ge extends Le{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Pd={type:"move"};class ta{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ge,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ge,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new A,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new A),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ge,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new A,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new A,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const x of t.hand.values()){const g=e.getJointPose(x,n),m=this._getHandJoint(c,x);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,p=.005;c.inputState.pinching&&d>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Pd)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new ge;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const _h={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},si={h:0,s:0,l:0},Ys={h:0,s:0,l:0};function ea(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Nt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Re){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,se.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=se.workingColorSpace){return this.r=t,this.g=e,this.b=n,se.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=se.workingColorSpace){if(t=Xo(t,1),e=Qt(e,0,1),n=Qt(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=ea(a,r,t+1/3),this.g=ea(a,r,t),this.b=ea(a,r,t-1/3)}return se.colorSpaceToWorking(this,s),this}setStyle(t,e=Re){function n(r){r!==void 0&&parseFloat(r)<1&&Ot("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Ot("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Ot("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Re){const n=_h[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Ot("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=$n(t.r),this.g=$n(t.g),this.b=$n(t.b),this}copyLinearToSRGB(t){return this.r=Qi(t.r),this.g=Qi(t.g),this.b=Qi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Re){return se.workingToColorSpace(Ge.copy(this),t),Math.round(Qt(Ge.r*255,0,255))*65536+Math.round(Qt(Ge.g*255,0,255))*256+Math.round(Qt(Ge.b*255,0,255))}getHexString(t=Re){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=se.workingColorSpace){se.workingToColorSpace(Ge.copy(this),e);const n=Ge.r,s=Ge.g,r=Ge.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=se.workingColorSpace){return se.workingToColorSpace(Ge.copy(this),e),t.r=Ge.r,t.g=Ge.g,t.b=Ge.b,t}getStyle(t=Re){se.workingToColorSpace(Ge.copy(this),t);const e=Ge.r,n=Ge.g,s=Ge.b;return t!==Re?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(si),this.setHSL(si.h+t,si.s+e,si.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(si),t.getHSL(Ys);const n=Ts(si.h,Ys.h,e),s=Ts(si.s,Ys.s,e),r=Ts(si.l,Ys.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ge=new Nt;Nt.NAMES=_h;class qo{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new Nt(t),this.density=e}clone(){return new qo(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}}class Ld extends Le{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new je,this.environmentIntensity=1,this.environmentRotation=new je,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const fn=new A,Nn=new A,na=new A,Fn=new A,Gi=new A,Vi=new A,Nl=new A,ia=new A,sa=new A,ra=new A,aa=new Me,oa=new Me,la=new Me;class mn{constructor(t=new A,e=new A,n=new A){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),fn.subVectors(t,e),s.cross(fn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){fn.subVectors(s,e),Nn.subVectors(n,e),na.subVectors(t,e);const a=fn.dot(fn),o=fn.dot(Nn),l=fn.dot(na),c=Nn.dot(Nn),h=Nn.dot(na),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;const d=1/u,f=(c*l-o*h)*d,p=(a*h-o*l)*d;return r.set(1-f-p,p,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Fn)===null?!1:Fn.x>=0&&Fn.y>=0&&Fn.x+Fn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,Fn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Fn.x),l.addScaledVector(a,Fn.y),l.addScaledVector(o,Fn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return aa.setScalar(0),oa.setScalar(0),la.setScalar(0),aa.fromBufferAttribute(t,e),oa.fromBufferAttribute(t,n),la.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(aa,r.x),a.addScaledVector(oa,r.y),a.addScaledVector(la,r.z),a}static isFrontFacing(t,e,n,s){return fn.subVectors(n,e),Nn.subVectors(t,e),fn.cross(Nn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return fn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),fn.cross(Nn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return mn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return mn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return mn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return mn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return mn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;Gi.subVectors(s,n),Vi.subVectors(r,n),ia.subVectors(t,n);const l=Gi.dot(ia),c=Vi.dot(ia);if(l<=0&&c<=0)return e.copy(n);sa.subVectors(t,s);const h=Gi.dot(sa),u=Vi.dot(sa);if(h>=0&&u<=h)return e.copy(s);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(Gi,a);ra.subVectors(t,r);const f=Gi.dot(ra),p=Vi.dot(ra);if(p>=0&&f<=p)return e.copy(r);const x=f*c-l*p;if(x<=0&&c>=0&&p<=0)return o=c/(c-p),e.copy(n).addScaledVector(Vi,o);const g=h*p-f*u;if(g<=0&&u-h>=0&&f-p>=0)return Nl.subVectors(r,s),o=(u-h)/(u-h+(f-p)),e.copy(s).addScaledVector(Nl,o);const m=1/(g+x+d);return a=x*m,o=d*m,e.copy(n).addScaledVector(Gi,a).addScaledVector(Vi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Li{constructor(t=new A(1/0,1/0,1/0),e=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(pn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(pn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=pn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,pn):pn.fromBufferAttribute(r,a),pn.applyMatrix4(t.matrixWorld),this.expandByPoint(pn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Zs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Zs.copy(n.boundingBox)),Zs.applyMatrix4(t.matrixWorld),this.union(Zs)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,pn),pn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(us),Ks.subVectors(this.max,us),Hi.subVectors(t.a,us),Wi.subVectors(t.b,us),Xi.subVectors(t.c,us),ri.subVectors(Wi,Hi),ai.subVectors(Xi,Wi),mi.subVectors(Hi,Xi);let e=[0,-ri.z,ri.y,0,-ai.z,ai.y,0,-mi.z,mi.y,ri.z,0,-ri.x,ai.z,0,-ai.x,mi.z,0,-mi.x,-ri.y,ri.x,0,-ai.y,ai.x,0,-mi.y,mi.x,0];return!ca(e,Hi,Wi,Xi,Ks)||(e=[1,0,0,0,1,0,0,0,1],!ca(e,Hi,Wi,Xi,Ks))?!1:(Js.crossVectors(ri,ai),e=[Js.x,Js.y,Js.z],ca(e,Hi,Wi,Xi,Ks))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,pn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(pn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(On[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),On[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),On[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),On[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),On[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),On[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),On[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),On[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(On),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const On=[new A,new A,new A,new A,new A,new A,new A,new A],pn=new A,Zs=new Li,Hi=new A,Wi=new A,Xi=new A,ri=new A,ai=new A,mi=new A,us=new A,Ks=new A,Js=new A,gi=new A;function ca(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){gi.fromArray(i,r);const o=s.x*Math.abs(gi.x)+s.y*Math.abs(gi.y)+s.z*Math.abs(gi.z),l=t.dot(gi),c=e.dot(gi),h=n.dot(gi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Te=new A,js=new ut;let Id=0;class Ze extends Ri{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Id++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=yl,this.updateRanges=[],this.gpuType=gn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)js.fromBufferAttribute(this,e),js.applyMatrix3(t),this.setXY(e,js.x,js.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.applyMatrix3(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.applyMatrix4(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.applyNormalMatrix(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Te.fromBufferAttribute(this,e),Te.transformDirection(t),this.setXYZ(e,Te.x,Te.y,Te.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Ji(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=qe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ji(e,this.array)),e}setX(t,e){return this.normalized&&(e=qe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ji(e,this.array)),e}setY(t,e){return this.normalized&&(e=qe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ji(e,this.array)),e}setZ(t,e){return this.normalized&&(e=qe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ji(e,this.array)),e}setW(t,e){return this.normalized&&(e=qe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=qe(e,this.array),n=qe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=qe(e,this.array),n=qe(n,this.array),s=qe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=qe(e,this.array),n=qe(n,this.array),s=qe(s,this.array),r=qe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==yl&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}}class yh extends Ze{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Mh extends Ze{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class ne extends Ze{constructor(t,e,n){super(new Float32Array(t),e,n)}}const Dd=new Li,ds=new A,ha=new A;class Ii{constructor(t=new A,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Dd.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ds.subVectors(t,this.center);const e=ds.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(ds,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ha.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ds.copy(t.center).add(ha)),this.expandByPoint(ds.copy(t.center).sub(ha))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let Ud=0;const ln=new ee,ua=new Le,$i=new A,en=new Li,fs=new Li,Ue=new A;class _e extends Ri{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ud++}),this.uuid=Pi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(ju(t)?Mh:yh)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new qt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return ln.makeRotationFromQuaternion(t),this.applyMatrix4(ln),this}rotateX(t){return ln.makeRotationX(t),this.applyMatrix4(ln),this}rotateY(t){return ln.makeRotationY(t),this.applyMatrix4(ln),this}rotateZ(t){return ln.makeRotationZ(t),this.applyMatrix4(ln),this}translate(t,e,n){return ln.makeTranslation(t,e,n),this.applyMatrix4(ln),this}scale(t,e,n){return ln.makeScale(t,e,n),this.applyMatrix4(ln),this}lookAt(t){return ua.lookAt(t),ua.updateMatrix(),this.applyMatrix4(ua.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter($i).negate(),this.translate($i.x,$i.y,$i.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new ne(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Ot("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Li);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){re("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];en.setFromBufferAttribute(r),this.morphTargetsRelative?(Ue.addVectors(this.boundingBox.min,en.min),this.boundingBox.expandByPoint(Ue),Ue.addVectors(this.boundingBox.max,en.max),this.boundingBox.expandByPoint(Ue)):(this.boundingBox.expandByPoint(en.min),this.boundingBox.expandByPoint(en.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&re('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ii);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){re("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new A,1/0);return}if(t){const n=this.boundingSphere.center;if(en.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];fs.setFromBufferAttribute(o),this.morphTargetsRelative?(Ue.addVectors(en.min,fs.min),en.expandByPoint(Ue),Ue.addVectors(en.max,fs.max),en.expandByPoint(Ue)):(en.expandByPoint(fs.min),en.expandByPoint(fs.max))}en.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Ue.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Ue));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ue.fromBufferAttribute(o,c),l&&($i.fromBufferAttribute(t,c),Ue.add($i)),s=Math.max(s,n.distanceToSquared(Ue))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&re('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){re("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ze(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let y=0;y<n.count;y++)o[y]=new A,l[y]=new A;const c=new A,h=new A,u=new A,d=new ut,f=new ut,p=new ut,x=new A,g=new A;function m(y,T,I){c.fromBufferAttribute(n,y),h.fromBufferAttribute(n,T),u.fromBufferAttribute(n,I),d.fromBufferAttribute(r,y),f.fromBufferAttribute(r,T),p.fromBufferAttribute(r,I),h.sub(c),u.sub(c),f.sub(d),p.sub(d);const C=1/(f.x*p.y-p.x*f.y);isFinite(C)&&(x.copy(h).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(C),g.copy(u).multiplyScalar(f.x).addScaledVector(h,-p.x).multiplyScalar(C),o[y].add(x),o[T].add(x),o[I].add(x),l[y].add(g),l[T].add(g),l[I].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let y=0,T=v.length;y<T;++y){const I=v[y],C=I.start,N=I.count;for(let H=C,W=C+N;H<W;H+=3)m(t.getX(H+0),t.getX(H+1),t.getX(H+2))}const M=new A,S=new A,R=new A,E=new A;function P(y){R.fromBufferAttribute(s,y),E.copy(R);const T=o[y];M.copy(T),M.sub(R.multiplyScalar(R.dot(T))).normalize(),S.crossVectors(E,T);const C=S.dot(l[y])<0?-1:1;a.setXYZW(y,M.x,M.y,M.z,C)}for(let y=0,T=v.length;y<T;++y){const I=v[y],C=I.start,N=I.count;for(let H=C,W=C+N;H<W;H+=3)P(t.getX(H+0)),P(t.getX(H+1)),P(t.getX(H+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ze(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const s=new A,r=new A,a=new A,o=new A,l=new A,c=new A,h=new A,u=new A;if(t)for(let d=0,f=t.count;d<f;d+=3){const p=t.getX(d+0),x=t.getX(d+1),g=t.getX(d+2);s.fromBufferAttribute(e,p),r.fromBufferAttribute(e,x),a.fromBufferAttribute(e,g),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,g),o.add(h),l.add(h),c.add(h),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)s.fromBufferAttribute(e,d+0),r.fromBufferAttribute(e,d+1),a.fromBufferAttribute(e,d+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ue.fromBufferAttribute(t,e),Ue.normalize(),t.setXYZ(e,Ue.x,Ue.y,Ue.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h);let f=0,p=0;for(let x=0,g=l.length;x<g;x++){o.isInterleavedBufferAttribute?f=l[x]*o.data.stride+o.offset:f=l[x]*h;for(let m=0;m<h;m++)d[p++]=c[f++]}return new Ze(d,h,u)}if(this.index===null)return Ot("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new _e,n=this.index.array,s=this.attributes;for(const o in s){const l=s[o],c=t(l,n);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){const d=c[h],f=t(d,n);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const f=c[u];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const s=t.attributes;for(const c in s){const h=s[c];this.setAttribute(c,h.clone(e))}const r=t.morphAttributes;for(const c in r){const h=[],u=r[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,h=a.length;c<h;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}let Nd=0;class Di extends Ri{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Nd++}),this.uuid=Pi(),this.name="",this.type="Material",this.blending=ji,this.side=fi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Fa,this.blendDst=Oa,this.blendEquation=yi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Nt(0,0,0),this.blendAlpha=0,this.depthFunc=ns,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=_l,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Fi,this.stencilZFail=Fi,this.stencilZPass=Fi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){Ot(`Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Ot(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ji&&(n.blending=this.blending),this.side!==fi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Fa&&(n.blendSrc=this.blendSrc),this.blendDst!==Oa&&(n.blendDst=this.blendDst),this.blendEquation!==yi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ns&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==_l&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Fi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Fi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Fi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const kn=new A,da=new A,Qs=new A,oi=new A,fa=new A,tr=new A,pa=new A;class Yo{constructor(t=new A,e=new A(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,kn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=kn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(kn.copy(this.origin).addScaledVector(this.direction,e),kn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){da.copy(t).add(e).multiplyScalar(.5),Qs.copy(e).sub(t).normalize(),oi.copy(this.origin).sub(da);const r=t.distanceTo(e)*.5,a=-this.direction.dot(Qs),o=oi.dot(this.direction),l=-oi.dot(Qs),c=oi.lengthSq(),h=Math.abs(1-a*a);let u,d,f,p;if(h>0)if(u=a*l-o,d=a*o-l,p=r*h,u>=0)if(d>=-p)if(d<=p){const x=1/h;u*=x,d*=x,f=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d<=-p?(u=Math.max(0,-(-a*r+o)),d=u>0?-r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c):d<=p?(u=0,d=Math.min(Math.max(-r,-l),r),f=d*(d+2*l)+c):(u=Math.max(0,-(a*r+o)),d=u>0?r:Math.min(Math.max(-r,-l),r),f=-u*u+d*(d+2*l)+c);else d=a>0?-r:r,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(da).addScaledVector(Qs,d),f}intersectSphere(t,e){kn.subVectors(t.center,this.origin);const n=kn.dot(this.direction),s=kn.dot(kn)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,s=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,s=(t.min.x-d.x)*c),h>=0?(r=(t.min.y-d.y)*h,a=(t.max.y-d.y)*h):(r=(t.max.y-d.y)*h,a=(t.min.y-d.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(o=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,kn)!==null}intersectTriangle(t,e,n,s,r){fa.subVectors(e,t),tr.subVectors(n,t),pa.crossVectors(fa,tr);let a=this.direction.dot(pa),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;oi.subVectors(this.origin,t);const l=o*this.direction.dot(tr.crossVectors(oi,tr));if(l<0)return null;const c=o*this.direction.dot(fa.cross(oi));if(c<0||l+c>a)return null;const h=-o*oi.dot(pa);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Oe extends Di{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new je,this.combine=eh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Fl=new ee,xi=new Yo,er=new Ii,Ol=new A,nr=new A,ir=new A,sr=new A,ma=new A,rr=new A,kl=new A,ar=new A;class Tt extends Le{constructor(t=new _e,e=new Oe){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){rr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],u=r[l];h!==0&&(ma.fromBufferAttribute(u,t),a?rr.addScaledVector(ma,h):rr.addScaledVector(ma.sub(e),h))}e.add(rr)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),er.copy(n.boundingSphere),er.applyMatrix4(r),xi.copy(t.ray).recast(t.near),!(er.containsPoint(xi.origin)===!1&&(xi.intersectSphere(er,Ol)===null||xi.origin.distanceToSquared(Ol)>(t.far-t.near)**2))&&(Fl.copy(r).invert(),xi.copy(t.ray).applyMatrix4(Fl),!(n.boundingBox!==null&&xi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,xi)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,x=d.length;p<x;p++){const g=d[p],m=a[g.materialIndex],v=Math.max(g.start,f.start),M=Math.min(o.count,Math.min(g.start+g.count,f.start+f.count));for(let S=v,R=M;S<R;S+=3){const E=o.getX(S),P=o.getX(S+1),y=o.getX(S+2);s=or(this,m,t,n,c,h,u,E,P,y),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{const p=Math.max(0,f.start),x=Math.min(o.count,f.start+f.count);for(let g=p,m=x;g<m;g+=3){const v=o.getX(g),M=o.getX(g+1),S=o.getX(g+2);s=or(this,a,t,n,c,h,u,v,M,S),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,x=d.length;p<x;p++){const g=d[p],m=a[g.materialIndex],v=Math.max(g.start,f.start),M=Math.min(l.count,Math.min(g.start+g.count,f.start+f.count));for(let S=v,R=M;S<R;S+=3){const E=S,P=S+1,y=S+2;s=or(this,m,t,n,c,h,u,E,P,y),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{const p=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let g=p,m=x;g<m;g+=3){const v=g,M=g+1,S=g+2;s=or(this,a,t,n,c,h,u,v,M,S),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}}function Fd(i,t,e,n,s,r,a,o){let l;if(t.side===Xe?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===fi,o),l===null)return null;ar.copy(o),ar.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(ar);return c<e.near||c>e.far?null:{distance:c,point:ar.clone(),object:i}}function or(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,nr),i.getVertexPosition(l,ir),i.getVertexPosition(c,sr);const h=Fd(i,t,e,n,nr,ir,sr,kl);if(h){const u=new A;mn.getBarycoord(kl,nr,ir,sr,u),s&&(h.uv=mn.getInterpolatedAttribute(s,o,l,c,u,new ut)),r&&(h.uv1=mn.getInterpolatedAttribute(r,o,l,c,u,new ut)),a&&(h.normal=mn.getInterpolatedAttribute(a,o,l,c,u,new A),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new A,materialIndex:0};mn.getNormal(nr,ir,sr,d.normal),h.face=d,h.barycoord=u}return h}class Sh extends $e{constructor(t=null,e=1,n=1,s,r,a,o,l,c=Fe,h=Fe,u,d){super(null,a,o,l,c,h,s,r,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Eo extends Ze{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const qi=new ee,Bl=new ee,lr=[],zl=new Li,Od=new ee,ps=new Tt,ms=new Ii;class Ee extends Tt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Eo(new Float32Array(n*16),16),this.previousInstanceMatrix=null,this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Od)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Li),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,qi),zl.copy(t.boundingBox).applyMatrix4(qi),this.boundingBox.union(zl)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ii),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,qi),ms.copy(t.boundingSphere).applyMatrix4(qi),this.boundingSphere.union(ms)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.previousInstanceMatrix!==null&&(this.previousInstanceMatrix=t.previousInstanceMatrix.clone()),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(ps.geometry=this.geometry,ps.material=this.material,ps.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ms.copy(this.boundingSphere),ms.applyMatrix4(n),t.ray.intersectsSphere(ms)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,qi),Bl.multiplyMatrices(n,qi),ps.matrixWorld=Bl,ps.raycast(t,lr);for(let a=0,o=lr.length;a<o;a++){const l=lr[a];l.instanceId=r,l.object=this,e.push(l)}lr.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Eo(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new Sh(new Float32Array(s*this.count),s,this.count,Bo,gn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const ga=new A,kd=new A,Bd=new qt;class _i{constructor(t=new A(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=ga.subVectors(n,e).cross(kd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){const s=t.delta(ga),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Bd.getNormalMatrix(t),s=this.coplanarPoint(ga).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const vi=new Ii,zd=new ut(.5,.5),cr=new A;class Zo{constructor(t=new _i,e=new _i,n=new _i,s=new _i,r=new _i,a=new _i){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=En,n=!1){const s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],u=r[5],d=r[6],f=r[7],p=r[8],x=r[9],g=r[10],m=r[11],v=r[12],M=r[13],S=r[14],R=r[15];if(s[0].setComponents(c-a,f-h,m-p,R-v).normalize(),s[1].setComponents(c+a,f+h,m+p,R+v).normalize(),s[2].setComponents(c+o,f+u,m+x,R+M).normalize(),s[3].setComponents(c-o,f-u,m-x,R-M).normalize(),n)s[4].setComponents(l,d,g,S).normalize(),s[5].setComponents(c-l,f-d,m-g,R-S).normalize();else if(s[4].setComponents(c-l,f-d,m-g,R-S).normalize(),e===En)s[5].setComponents(c+l,f+d,m+g,R+S).normalize();else if(e===Is)s[5].setComponents(l,d,g,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),vi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),vi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(vi)}intersectsSprite(t){vi.center.set(0,0,0);const e=zd.distanceTo(t.center);return vi.radius=.7071067811865476+e,vi.applyMatrix4(t.matrixWorld),this.intersectsSphere(vi)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(cr.x=s.normal.x>0?t.max.x:t.min.x,cr.y=s.normal.y>0?t.max.y:t.min.y,cr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(cr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class bh extends Di{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Nt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Nr=new A,Fr=new A,Gl=new ee,gs=new Yo,hr=new Ii,xa=new A,Vl=new A;class Gd extends Le{constructor(t=new _e,e=new bh){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Nr.fromBufferAttribute(e,s-1),Fr.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Nr.distanceTo(Fr);t.setAttribute("lineDistance",new ne(n,1))}else Ot("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),hr.copy(n.boundingSphere),hr.applyMatrix4(s),hr.radius+=r,t.ray.intersectsSphere(hr)===!1)return;Gl.copy(s).invert(),gs.copy(t.ray).applyMatrix4(Gl);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){const f=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let x=f,g=p-1;x<g;x+=c){const m=h.getX(x),v=h.getX(x+1),M=ur(this,t,gs,l,m,v,x);M&&e.push(M)}if(this.isLineLoop){const x=h.getX(p-1),g=h.getX(f),m=ur(this,t,gs,l,x,g,p-1);m&&e.push(m)}}else{const f=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let x=f,g=p-1;x<g;x+=c){const m=ur(this,t,gs,l,x,x+1,x);m&&e.push(m)}if(this.isLineLoop){const x=ur(this,t,gs,l,p-1,f,p-1);x&&e.push(x)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ur(i,t,e,n,s,r,a){const o=i.geometry.attributes.position;if(Nr.fromBufferAttribute(o,s),Fr.fromBufferAttribute(o,r),e.distanceSqToSegment(Nr,Fr,xa,Vl)>n)return;xa.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(xa);if(!(c<t.near||c>t.far))return{distance:c,point:Vl.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}const Hl=new A,Wl=new A;class Vd extends Gd{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Hl.fromBufferAttribute(e,s),Wl.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Hl.distanceTo(Wl);t.setAttribute("lineDistance",new ne(n,1))}else Ot("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class wh extends Di{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Nt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Xl=new ee,To=new Yo,dr=new Ii,fr=new A;class Hd extends Le{constructor(t=new _e,e=new wh){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),dr.copy(n.boundingSphere),dr.applyMatrix4(s),dr.radius+=r,t.ray.intersectsSphere(dr)===!1)return;Xl.copy(s).invert(),To.copy(t.ray).applyMatrix4(Xl);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){const d=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let p=d,x=f;p<x;p++){const g=c.getX(p);fr.fromBufferAttribute(u,g),$l(fr,g,l,s,t,e,this)}}else{const d=Math.max(0,a.start),f=Math.min(u.count,a.start+a.count);for(let p=d,x=f;p<x;p++)fr.fromBufferAttribute(u,p),$l(fr,p,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function $l(i,t,e,n,s,r,a){const o=To.distanceSqToPoint(i);if(o<e){const l=new A;To.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class Eh extends $e{constructor(t=[],e=Ei,n,s,r,a,o,l,c,h){super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class ls extends $e{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class ss extends $e{constructor(t,e,n=Ln,s,r,a,o=Fe,l=Fe,c,h=Zn,u=1){if(h!==Zn&&h!==bi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:t,height:e,depth:u};super(d,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new $o(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class Wd extends ss{constructor(t,e=Ln,n=Ei,s,r,a=Fe,o=Fe,l,c=Zn){const h={width:t,height:t,depth:1},u=[h,h,h,h,h,h];super(t,t,e,n,s,r,a,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Th extends $e{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class Pe extends _e{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],u=[];let d=0,f=0;p("z","y","x",-1,-1,n,e,t,a,r,0),p("z","y","x",1,-1,n,e,-t,a,r,1),p("x","z","y",1,1,t,n,e,s,a,2),p("x","z","y",1,-1,t,n,-e,s,a,3),p("x","y","z",1,-1,t,e,n,s,r,4),p("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new ne(c,3)),this.setAttribute("normal",new ne(h,3)),this.setAttribute("uv",new ne(u,2));function p(x,g,m,v,M,S,R,E,P,y,T){const I=S/P,C=R/y,N=S/2,H=R/2,W=E/2,D=P+1,B=y+1;let k=0,J=0;const et=new A;for(let dt=0;dt<B;dt++){const yt=dt*C-H;for(let At=0;At<D;At++){const $t=At*I-N;et[x]=$t*v,et[g]=yt*M,et[m]=W,c.push(et.x,et.y,et.z),et[x]=0,et[g]=0,et[m]=E>0?1:-1,h.push(et.x,et.y,et.z),u.push(At/P),u.push(1-dt/y),k+=1}}for(let dt=0;dt<y;dt++)for(let yt=0;yt<P;yt++){const At=d+yt+D*dt,$t=d+yt+D*(dt+1),ie=d+(yt+1)+D*(dt+1),Bt=d+(yt+1)+D*dt;l.push(At,$t,Bt),l.push($t,ie,Bt),J+=6}o.addGroup(f,J,T),f+=J,d+=k}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Pe(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class Ko extends _e{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],a=[],o=[],l=[],c=new A,h=new ut;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=e;u++,d+=3){const f=n+u/e*s;c.x=t*Math.cos(f),c.y=t*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/t+1)/2,h.y=(a[d+1]/t+1)/2,l.push(h.x,h.y)}for(let u=1;u<=e;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new ne(a,3)),this.setAttribute("normal",new ne(o,3)),this.setAttribute("uv",new ne(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ko(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Ne extends _e{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const h=[],u=[],d=[],f=[];let p=0;const x=[],g=n/2;let m=0;v(),a===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new ne(u,3)),this.setAttribute("normal",new ne(d,3)),this.setAttribute("uv",new ne(f,2));function v(){const S=new A,R=new A;let E=0;const P=(e-t)/n;for(let y=0;y<=r;y++){const T=[],I=y/r,C=I*(e-t)+t;for(let N=0;N<=s;N++){const H=N/s,W=H*l+o,D=Math.sin(W),B=Math.cos(W);R.x=C*D,R.y=-I*n+g,R.z=C*B,u.push(R.x,R.y,R.z),S.set(D,P,B).normalize(),d.push(S.x,S.y,S.z),f.push(H,1-I),T.push(p++)}x.push(T)}for(let y=0;y<s;y++)for(let T=0;T<r;T++){const I=x[T][y],C=x[T+1][y],N=x[T+1][y+1],H=x[T][y+1];(t>0||T!==0)&&(h.push(I,C,H),E+=3),(e>0||T!==r-1)&&(h.push(C,N,H),E+=3)}c.addGroup(m,E,0),m+=E}function M(S){const R=p,E=new ut,P=new A;let y=0;const T=S===!0?t:e,I=S===!0?1:-1;for(let N=1;N<=s;N++)u.push(0,g*I,0),d.push(0,I,0),f.push(.5,.5),p++;const C=p;for(let N=0;N<=s;N++){const W=N/s*l+o,D=Math.cos(W),B=Math.sin(W);P.x=T*B,P.y=g*I,P.z=T*D,u.push(P.x,P.y,P.z),d.push(0,I,0),E.x=D*.5+.5,E.y=B*.5*I+.5,f.push(E.x,E.y),p++}for(let N=0;N<s;N++){const H=R+N,W=C+N;S===!0?h.push(W,W+1,H):h.push(W+1,W,H),y+=3}c.addGroup(m,y,S===!0?1:2),m+=y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ne(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class ts extends Ne{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new ts(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Jo extends _e{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],a=[];o(s),c(n),h(),this.setAttribute("position",new ne(r,3)),this.setAttribute("normal",new ne(r.slice(),3)),this.setAttribute("uv",new ne(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(v){const M=new A,S=new A,R=new A;for(let E=0;E<e.length;E+=3)f(e[E+0],M),f(e[E+1],S),f(e[E+2],R),l(M,S,R,v)}function l(v,M,S,R){const E=R+1,P=[];for(let y=0;y<=E;y++){P[y]=[];const T=v.clone().lerp(S,y/E),I=M.clone().lerp(S,y/E),C=E-y;for(let N=0;N<=C;N++)N===0&&y===E?P[y][N]=T:P[y][N]=T.clone().lerp(I,N/C)}for(let y=0;y<E;y++)for(let T=0;T<2*(E-y)-1;T++){const I=Math.floor(T/2);T%2===0?(d(P[y][I+1]),d(P[y+1][I]),d(P[y][I])):(d(P[y][I+1]),d(P[y+1][I+1]),d(P[y+1][I]))}}function c(v){const M=new A;for(let S=0;S<r.length;S+=3)M.x=r[S+0],M.y=r[S+1],M.z=r[S+2],M.normalize().multiplyScalar(v),r[S+0]=M.x,r[S+1]=M.y,r[S+2]=M.z}function h(){const v=new A;for(let M=0;M<r.length;M+=3){v.x=r[M+0],v.y=r[M+1],v.z=r[M+2];const S=g(v)/2/Math.PI+.5,R=m(v)/Math.PI+.5;a.push(S,1-R)}p(),u()}function u(){for(let v=0;v<a.length;v+=6){const M=a[v+0],S=a[v+2],R=a[v+4],E=Math.max(M,S,R),P=Math.min(M,S,R);E>.9&&P<.1&&(M<.2&&(a[v+0]+=1),S<.2&&(a[v+2]+=1),R<.2&&(a[v+4]+=1))}}function d(v){r.push(v.x,v.y,v.z)}function f(v,M){const S=v*3;M.x=t[S+0],M.y=t[S+1],M.z=t[S+2]}function p(){const v=new A,M=new A,S=new A,R=new A,E=new ut,P=new ut,y=new ut;for(let T=0,I=0;T<r.length;T+=9,I+=6){v.set(r[T+0],r[T+1],r[T+2]),M.set(r[T+3],r[T+4],r[T+5]),S.set(r[T+6],r[T+7],r[T+8]),E.set(a[I+0],a[I+1]),P.set(a[I+2],a[I+3]),y.set(a[I+4],a[I+5]),R.copy(v).add(M).add(S).divideScalar(3);const C=g(R);x(E,I+0,v,C),x(P,I+2,M,C),x(y,I+4,S,C)}}function x(v,M,S,R){R<0&&v.x===1&&(a[M]=v.x-1),S.x===0&&S.z===0&&(a[M]=R/2/Math.PI+.5)}function g(v){return Math.atan2(v.z,-v.x)}function m(v){return Math.atan2(-v.y,Math.sqrt(v.x*v.x+v.z*v.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Jo(t.vertices,t.indices,t.radius,t.detail)}}class In{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ot("Curve: .getPoint() not implemented.")}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const n=this.getLengths();let s=0;const r=n.length;let a;e?a=e:a=t*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);const h=n[s],d=n[s+1]-h,f=(a-h)/d;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const a=this.getPoint(s),o=this.getPoint(r),l=e||(a.isVector2?new ut:new A);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){const n=new A,s=[],r=[],a=[],o=new A,l=new ee;for(let f=0;f<=t;f++){const p=f/t;s[f]=this.getTangentAt(p,new A)}r[0]=new A,a[0]=new A;let c=Number.MAX_VALUE;const h=Math.abs(s[0].x),u=Math.abs(s[0].y),d=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(s[f-1],s[f]),o.length()>Number.EPSILON){o.normalize();const p=Math.acos(Qt(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(o,p))}a[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(Qt(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(f=-f);for(let p=1;p<=t;p++)r[p].applyMatrix4(l.makeRotationAxis(s[p],f*p)),a[p].crossVectors(s[p],r[p])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class jo extends In{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new ut){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);const o=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Xd extends jo{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function Qo(){let i=0,t=0,e=0,n=0;function s(r,a,o,l){i=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let d=(a-r)/c-(o-r)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,f*=h,s(a,o,d,f)},calc:function(r){const a=r*r,o=a*r;return i+t*r+e*a+n*o}}}const ql=new A,Yl=new A,va=new Qo,_a=new Qo,ya=new Qo;class Ah extends In{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new A){const n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(Yl.subVectors(s[0],s[1]).add(s[0]),c=Yl);const u=s[o%r],d=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(ql.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=ql),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let p=Math.pow(c.distanceToSquared(u),f),x=Math.pow(u.distanceToSquared(d),f),g=Math.pow(d.distanceToSquared(h),f);x<1e-4&&(x=1),p<1e-4&&(p=x),g<1e-4&&(g=x),va.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,p,x,g),_a.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,p,x,g),ya.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,p,x,g)}else this.curveType==="catmullrom"&&(va.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),_a.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),ya.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(va.calc(l),_a.calc(l),ya.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new A().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Zl(i,t,e,n,s){const r=(n-t)*.5,a=(s-e)*.5,o=i*i,l=i*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*i+e}function $d(i,t){const e=1-i;return e*e*t}function qd(i,t){return 2*(1-i)*i*t}function Yd(i,t){return i*i*t}function As(i,t,e,n){return $d(i,t)+qd(i,e)+Yd(i,n)}function Zd(i,t){const e=1-i;return e*e*e*t}function Kd(i,t){const e=1-i;return 3*e*e*i*t}function Jd(i,t){return 3*(1-i)*i*i*t}function jd(i,t){return i*i*i*t}function Cs(i,t,e,n,s){return Zd(i,t)+Kd(i,e)+Jd(i,n)+jd(i,s)}class Ch extends In{constructor(t=new ut,e=new ut,n=new ut,s=new ut){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new ut){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Cs(t,s.x,r.x,a.x,o.x),Cs(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Qd extends In{constructor(t=new A,e=new A,n=new A,s=new A){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new A){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Cs(t,s.x,r.x,a.x,o.x),Cs(t,s.y,r.y,a.y,o.y),Cs(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Rh extends In{constructor(t=new ut,e=new ut){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ut){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ut){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class tf extends In{constructor(t=new A,e=new A){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new A){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new A){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ph extends In{constructor(t=new ut,e=new ut,n=new ut){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new ut){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(As(t,s.x,r.x,a.x),As(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class tl extends In{constructor(t=new A,e=new A,n=new A){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new A){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(As(t,s.x,r.x,a.x),As(t,s.y,r.y,a.y),As(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Lh extends In{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ut){const n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],u=s[a>s.length-3?s.length-1:a+2];return n.set(Zl(o,l.x,c.x,h.x,u.x),Zl(o,l.y,c.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new ut().fromArray(s))}return this}}var Or=Object.freeze({__proto__:null,ArcCurve:Xd,CatmullRomCurve3:Ah,CubicBezierCurve:Ch,CubicBezierCurve3:Qd,EllipseCurve:jo,LineCurve:Rh,LineCurve3:tf,QuadraticBezierCurve:Ph,QuadraticBezierCurve3:tl,SplineCurve:Lh});class ef extends In{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Or[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Or[s.type]().fromJSON(s))}return this}}class Kl extends ef{constructor(t){super(),this.type="Path",this.currentPoint=new ut,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Rh(this.currentPoint.clone(),new ut(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new Ph(this.currentPoint.clone(),new ut(t,e),new ut(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,a){const o=new Ch(this.currentPoint.clone(),new ut(t,e),new ut(n,s),new ut(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Lh(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,s,r,a),this}absarc(t,e,n,s,r,a){return this.absellipse(t,e,n,n,s,r,a),this}ellipse(t,e,n,s,r,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,s,r,a,o,l),this}absellipse(t,e,n,s,r,a,o,l){const c=new jo(t,e,n,s,r,a,o,l);if(this.curves.length>0){const u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class rn extends Kl{constructor(t){super(t),this.uuid=Pi(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new Kl().fromJSON(s))}return this}}function nf(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=Ih(i,0,s,e,!0);const a=[];if(!r||r.next===r.prev)return a;let o,l,c;if(n&&(r=lf(i,t,r,e)),i.length>80*e){o=i[0],l=i[1];let h=o,u=l;for(let d=e;d<s;d+=e){const f=i[d],p=i[d+1];f<o&&(o=f),p<l&&(l=p),f>h&&(h=f),p>u&&(u=p)}c=Math.max(h-o,u-l),c=c!==0?32767/c:0}return Us(r,a,e,o,l,c,0),a}function Ih(i,t,e,n,s){let r;if(s===_f(i,t,e,n)>0)for(let a=t;a<e;a+=n)r=Jl(a/n|0,i[a],i[a+1],r);else for(let a=e-n;a>=t;a-=n)r=Jl(a/n|0,i[a],i[a+1],r);return r&&rs(r,r.next)&&(Fs(r),r=r.next),r}function Ci(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(rs(e,e.next)||ve(e.prev,e,e.next)===0)){if(Fs(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Us(i,t,e,n,s,r,a){if(!i)return;!a&&r&&ff(i,n,s,r);let o=i;for(;i.prev!==i.next;){const l=i.prev,c=i.next;if(r?rf(i,n,s,r):sf(i)){t.push(l.i,i.i,c.i),Fs(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=af(Ci(i),t),Us(i,t,e,n,s,r,2)):a===2&&of(i,t,e,n,s,r):Us(Ci(i),t,e,n,s,r,1);break}}}function sf(i){const t=i.prev,e=i,n=i.next;if(ve(t,e,n)>=0)return!1;const s=t.x,r=e.x,a=n.x,o=t.y,l=e.y,c=n.y,h=Math.min(s,r,a),u=Math.min(o,l,c),d=Math.max(s,r,a),f=Math.max(o,l,c);let p=n.next;for(;p!==t;){if(p.x>=h&&p.x<=d&&p.y>=u&&p.y<=f&&Ss(s,o,r,l,a,c,p.x,p.y)&&ve(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function rf(i,t,e,n){const s=i.prev,r=i,a=i.next;if(ve(s,r,a)>=0)return!1;const o=s.x,l=r.x,c=a.x,h=s.y,u=r.y,d=a.y,f=Math.min(o,l,c),p=Math.min(h,u,d),x=Math.max(o,l,c),g=Math.max(h,u,d),m=Ao(f,p,t,e,n),v=Ao(x,g,t,e,n);let M=i.prevZ,S=i.nextZ;for(;M&&M.z>=m&&S&&S.z<=v;){if(M.x>=f&&M.x<=x&&M.y>=p&&M.y<=g&&M!==s&&M!==a&&Ss(o,h,l,u,c,d,M.x,M.y)&&ve(M.prev,M,M.next)>=0||(M=M.prevZ,S.x>=f&&S.x<=x&&S.y>=p&&S.y<=g&&S!==s&&S!==a&&Ss(o,h,l,u,c,d,S.x,S.y)&&ve(S.prev,S,S.next)>=0))return!1;S=S.nextZ}for(;M&&M.z>=m;){if(M.x>=f&&M.x<=x&&M.y>=p&&M.y<=g&&M!==s&&M!==a&&Ss(o,h,l,u,c,d,M.x,M.y)&&ve(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;S&&S.z<=v;){if(S.x>=f&&S.x<=x&&S.y>=p&&S.y<=g&&S!==s&&S!==a&&Ss(o,h,l,u,c,d,S.x,S.y)&&ve(S.prev,S,S.next)>=0)return!1;S=S.nextZ}return!0}function af(i,t){let e=i;do{const n=e.prev,s=e.next.next;!rs(n,s)&&Uh(n,e,e.next,s)&&Ns(n,s)&&Ns(s,n)&&(t.push(n.i,e.i,s.i),Fs(e),Fs(e.next),e=i=s),e=e.next}while(e!==i);return Ci(e)}function of(i,t,e,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&gf(a,o)){let l=Nh(a,o);a=Ci(a,a.next),l=Ci(l,l.next),Us(a,t,e,n,s,r,0),Us(l,t,e,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function lf(i,t,e,n){const s=[];for(let r=0,a=t.length;r<a;r++){const o=t[r]*n,l=r<a-1?t[r+1]*n:i.length,c=Ih(i,o,l,n,!1);c===c.next&&(c.steiner=!0),s.push(mf(c))}s.sort(cf);for(let r=0;r<s.length;r++)e=hf(s[r],e);return e}function cf(i,t){let e=i.x-t.x;if(e===0&&(e=i.y-t.y,e===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),s=(t.next.y-t.y)/(t.next.x-t.x);e=n-s}return e}function hf(i,t){const e=uf(i,t);if(!e)return t;const n=Nh(e,i);return Ci(n,n.next),Ci(e,e.next)}function uf(i,t){let e=t;const n=i.x,s=i.y;let r=-1/0,a;if(rs(i,e))return e;do{if(rs(i,e.next))return e.next;if(s<=e.y&&s>=e.next.y&&e.next.y!==e.y){const u=e.x+(s-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(u<=n&&u>r&&(r=u,a=e.x<e.next.x?e:e.next,u===n))return a}e=e.next}while(e!==t);if(!a)return null;const o=a,l=a.x,c=a.y;let h=1/0;e=a;do{if(n>=e.x&&e.x>=l&&n!==e.x&&Dh(s<c?n:r,s,l,c,s<c?r:n,s,e.x,e.y)){const u=Math.abs(s-e.y)/(n-e.x);Ns(e,i)&&(u<h||u===h&&(e.x>a.x||e.x===a.x&&df(a,e)))&&(a=e,h=u)}e=e.next}while(e!==o);return a}function df(i,t){return ve(i.prev,i,t.prev)<0&&ve(t.next,i,i.next)<0}function ff(i,t,e,n){let s=i;do s.z===0&&(s.z=Ao(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,pf(s)}function pf(i){let t,e=1;do{let n=i,s;i=null;let r=null;for(t=0;n;){t++;let a=n,o=0;for(let c=0;c<e&&(o++,a=a.nextZ,!!a);c++);let l=e;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(s=n,n=n.nextZ,o--):(s=a,a=a.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=a}r.nextZ=null,e*=2}while(t>1);return i}function Ao(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function mf(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Dh(i,t,e,n,s,r,a,o){return(s-a)*(t-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(s-a)*(n-o)}function Ss(i,t,e,n,s,r,a,o){return!(i===a&&t===o)&&Dh(i,t,e,n,s,r,a,o)}function gf(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!xf(i,t)&&(Ns(i,t)&&Ns(t,i)&&vf(i,t)&&(ve(i.prev,i,t.prev)||ve(i,t.prev,t))||rs(i,t)&&ve(i.prev,i,i.next)>0&&ve(t.prev,t,t.next)>0)}function ve(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function rs(i,t){return i.x===t.x&&i.y===t.y}function Uh(i,t,e,n){const s=mr(ve(i,t,e)),r=mr(ve(i,t,n)),a=mr(ve(e,n,i)),o=mr(ve(e,n,t));return!!(s!==r&&a!==o||s===0&&pr(i,e,t)||r===0&&pr(i,n,t)||a===0&&pr(e,i,n)||o===0&&pr(e,t,n))}function pr(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function mr(i){return i>0?1:i<0?-1:0}function xf(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&Uh(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function Ns(i,t){return ve(i.prev,i,i.next)<0?ve(i,t,i.next)>=0&&ve(i,i.prev,t)>=0:ve(i,t,i.prev)<0||ve(i,i.next,t)<0}function vf(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function Nh(i,t){const e=Co(i.i,i.x,i.y),n=Co(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function Jl(i,t,e,n){const s=Co(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function Fs(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Co(i,t,e){return{i,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function _f(i,t,e,n){let s=0;for(let r=t,a=e-n;r<e;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}class yf{static triangulate(t,e,n=2){return nf(t,e,n)}}class Wn{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return Wn.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];jl(t),Ql(n,t);let a=t.length;e.forEach(jl);for(let l=0;l<e.length;l++)s.push(a),a+=e[l].length,Ql(n,e[l]);const o=yf.triangulate(n,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}}function jl(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Ql(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class Rn extends _e{constructor(t=new rn([new ut(.5,.5),new ut(-.5,.5),new ut(-.5,-.5),new ut(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let o=0,l=t.length;o<l;o++){const c=t[o];a(c)}this.setAttribute("position",new ne(s,3)),this.setAttribute("uv",new ne(r,2)),this.computeVertexNormals();function a(o){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1;let d=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,p=e.bevelSize!==void 0?e.bevelSize:f-.1,x=e.bevelOffset!==void 0?e.bevelOffset:0,g=e.bevelSegments!==void 0?e.bevelSegments:3;const m=e.extrudePath,v=e.UVGenerator!==void 0?e.UVGenerator:Mf;let M,S=!1,R,E,P,y;if(m){M=m.getSpacedPoints(h),S=!0,d=!1;const K=m.isCatmullRomCurve3?m.closed:!1;R=m.computeFrenetFrames(h,K),E=new A,P=new A,y=new A}d||(g=0,f=0,p=0,x=0);const T=o.extractPoints(c);let I=T.shape;const C=T.holes;if(!Wn.isClockWise(I)){I=I.reverse();for(let K=0,nt=C.length;K<nt;K++){const j=C[K];Wn.isClockWise(j)&&(C[K]=j.reverse())}}function H(K){const j=10000000000000001e-36;let vt=K[0];for(let ft=1;ft<=K.length;ft++){const Vt=ft%K.length,L=K[Vt],Wt=L.x-vt.x,Rt=L.y-vt.y,Ht=Wt*Wt+Rt*Rt,st=Math.max(Math.abs(L.x),Math.abs(L.y),Math.abs(vt.x),Math.abs(vt.y)),ce=j*st*st;if(Ht<=ce){K.splice(Vt,1),ft--;continue}vt=L}}H(I),C.forEach(H);const W=C.length,D=I;for(let K=0;K<W;K++){const nt=C[K];I=I.concat(nt)}function B(K,nt,j){return nt||re("ExtrudeGeometry: vec does not exist"),K.clone().addScaledVector(nt,j)}const k=I.length;function J(K,nt,j){let vt,ft,Vt;const L=K.x-nt.x,Wt=K.y-nt.y,Rt=j.x-K.x,Ht=j.y-K.y,st=L*L+Wt*Wt,ce=L*Ht-Wt*Rt;if(Math.abs(ce)>Number.EPSILON){const w=Math.sqrt(st),_=Math.sqrt(Rt*Rt+Ht*Ht),O=nt.x-Wt/w,q=nt.y+L/w,Q=j.x-Ht/_,rt=j.y+Rt/_,lt=((Q-O)*Ht-(rt-q)*Rt)/(L*Ht-Wt*Rt);vt=O+L*lt-K.x,ft=q+Wt*lt-K.y;const X=vt*vt+ft*ft;if(X<=2)return new ut(vt,ft);Vt=Math.sqrt(X/2)}else{let w=!1;L>Number.EPSILON?Rt>Number.EPSILON&&(w=!0):L<-Number.EPSILON?Rt<-Number.EPSILON&&(w=!0):Math.sign(Wt)===Math.sign(Ht)&&(w=!0),w?(vt=-Wt,ft=L,Vt=Math.sqrt(st)):(vt=L,ft=Wt,Vt=Math.sqrt(st/2))}return new ut(vt/Vt,ft/Vt)}const et=[];for(let K=0,nt=D.length,j=nt-1,vt=K+1;K<nt;K++,j++,vt++)j===nt&&(j=0),vt===nt&&(vt=0),et[K]=J(D[K],D[j],D[vt]);const dt=[];let yt,At=et.concat();for(let K=0,nt=W;K<nt;K++){const j=C[K];yt=[];for(let vt=0,ft=j.length,Vt=ft-1,L=vt+1;vt<ft;vt++,Vt++,L++)Vt===ft&&(Vt=0),L===ft&&(L=0),yt[vt]=J(j[vt],j[Vt],j[L]);dt.push(yt),At=At.concat(yt)}let $t;if(g===0)$t=Wn.triangulateShape(D,C);else{const K=[],nt=[];for(let j=0;j<g;j++){const vt=j/g,ft=f*Math.cos(vt*Math.PI/2),Vt=p*Math.sin(vt*Math.PI/2)+x;for(let L=0,Wt=D.length;L<Wt;L++){const Rt=B(D[L],et[L],Vt);Ct(Rt.x,Rt.y,-ft),vt===0&&K.push(Rt)}for(let L=0,Wt=W;L<Wt;L++){const Rt=C[L];yt=dt[L];const Ht=[];for(let st=0,ce=Rt.length;st<ce;st++){const w=B(Rt[st],yt[st],Vt);Ct(w.x,w.y,-ft),vt===0&&Ht.push(w)}vt===0&&nt.push(Ht)}}$t=Wn.triangulateShape(K,nt)}const ie=$t.length,Bt=p+x;for(let K=0;K<k;K++){const nt=d?B(I[K],At[K],Bt):I[K];S?(P.copy(R.normals[0]).multiplyScalar(nt.x),E.copy(R.binormals[0]).multiplyScalar(nt.y),y.copy(M[0]).add(P).add(E),Ct(y.x,y.y,y.z)):Ct(nt.x,nt.y,0)}for(let K=1;K<=h;K++)for(let nt=0;nt<k;nt++){const j=d?B(I[nt],At[nt],Bt):I[nt];S?(P.copy(R.normals[K]).multiplyScalar(j.x),E.copy(R.binormals[K]).multiplyScalar(j.y),y.copy(M[K]).add(P).add(E),Ct(y.x,y.y,y.z)):Ct(j.x,j.y,u/h*K)}for(let K=g-1;K>=0;K--){const nt=K/g,j=f*Math.cos(nt*Math.PI/2),vt=p*Math.sin(nt*Math.PI/2)+x;for(let ft=0,Vt=D.length;ft<Vt;ft++){const L=B(D[ft],et[ft],vt);Ct(L.x,L.y,u+j)}for(let ft=0,Vt=C.length;ft<Vt;ft++){const L=C[ft];yt=dt[ft];for(let Wt=0,Rt=L.length;Wt<Rt;Wt++){const Ht=B(L[Wt],yt[Wt],vt);S?Ct(Ht.x,Ht.y+M[h-1].y,M[h-1].x+j):Ct(Ht.x,Ht.y,u+j)}}}Y(),pt();function Y(){const K=s.length/3;if(d){let nt=0,j=k*nt;for(let vt=0;vt<ie;vt++){const ft=$t[vt];Ft(ft[2]+j,ft[1]+j,ft[0]+j)}nt=h+g*2,j=k*nt;for(let vt=0;vt<ie;vt++){const ft=$t[vt];Ft(ft[0]+j,ft[1]+j,ft[2]+j)}}else{for(let nt=0;nt<ie;nt++){const j=$t[nt];Ft(j[2],j[1],j[0])}for(let nt=0;nt<ie;nt++){const j=$t[nt];Ft(j[0]+k*h,j[1]+k*h,j[2]+k*h)}}n.addGroup(K,s.length/3-K,0)}function pt(){const K=s.length/3;let nt=0;it(D,nt),nt+=D.length;for(let j=0,vt=C.length;j<vt;j++){const ft=C[j];it(ft,nt),nt+=ft.length}n.addGroup(K,s.length/3-K,1)}function it(K,nt){let j=K.length;for(;--j>=0;){const vt=j;let ft=j-1;ft<0&&(ft=K.length-1);for(let Vt=0,L=h+g*2;Vt<L;Vt++){const Wt=k*Vt,Rt=k*(Vt+1),Ht=nt+vt+Wt,st=nt+ft+Wt,ce=nt+ft+Rt,w=nt+vt+Rt;kt(Ht,st,ce,w)}}}function Ct(K,nt,j){l.push(K),l.push(nt),l.push(j)}function Ft(K,nt,j){ae(K),ae(nt),ae(j);const vt=s.length/3,ft=v.generateTopUV(n,s,vt-3,vt-2,vt-1);Gt(ft[0]),Gt(ft[1]),Gt(ft[2])}function kt(K,nt,j,vt){ae(K),ae(nt),ae(vt),ae(nt),ae(j),ae(vt);const ft=s.length/3,Vt=v.generateSideWallUV(n,s,ft-6,ft-3,ft-2,ft-1);Gt(Vt[0]),Gt(Vt[1]),Gt(Vt[3]),Gt(Vt[1]),Gt(Vt[2]),Gt(Vt[3])}function ae(K){s.push(l[K*3+0]),s.push(l[K*3+1]),s.push(l[K*3+2])}function Gt(K){r.push(K.x),r.push(K.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return Sf(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,a=t.shapes.length;r<a;r++){const o=e[t.shapes[r]];n.push(o)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Or[s.type]().fromJSON(s)),new Rn(n,t.options)}}const Mf={generateTopUV:function(i,t,e,n,s){const r=t[e*3],a=t[e*3+1],o=t[n*3],l=t[n*3+1],c=t[s*3],h=t[s*3+1];return[new ut(r,a),new ut(o,l),new ut(c,h)]},generateSideWallUV:function(i,t,e,n,s,r){const a=t[e*3],o=t[e*3+1],l=t[e*3+2],c=t[n*3],h=t[n*3+1],u=t[n*3+2],d=t[s*3],f=t[s*3+1],p=t[s*3+2],x=t[r*3],g=t[r*3+1],m=t[r*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new ut(a,1-l),new ut(c,1-u),new ut(d,1-p),new ut(x,1-m)]:[new ut(o,1-l),new ut(h,1-u),new ut(f,1-p),new ut(g,1-m)]}};function Sf(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class Os extends Jo{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Os(t.radius,t.detail)}}class Ae extends _e{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,u=t/o,d=e/l,f=[],p=[],x=[],g=[];for(let m=0;m<h;m++){const v=m*d-a;for(let M=0;M<c;M++){const S=M*u-r;p.push(S,-v,0),x.push(0,0,1),g.push(M/o),g.push(1-m/l)}}for(let m=0;m<l;m++)for(let v=0;v<o;v++){const M=v+c*m,S=v+c*(m+1),R=v+1+c*(m+1),E=v+1+c*m;f.push(M,S,E),f.push(S,R,E)}this.setIndex(f),this.setAttribute("position",new ne(p,3)),this.setAttribute("normal",new ne(x,3)),this.setAttribute("uv",new ne(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ae(t.width,t.height,t.widthSegments,t.heightSegments)}}class Gs extends _e{constructor(t=new rn([new ut(0,.5),new ut(-.5,-.5),new ut(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};const n=[],s=[],r=[],a=[];let o=0,l=0;if(Array.isArray(t)===!1)c(t);else for(let h=0;h<t.length;h++)c(t[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new ne(s,3)),this.setAttribute("normal",new ne(r,3)),this.setAttribute("uv",new ne(a,2));function c(h){const u=s.length/3,d=h.extractPoints(e);let f=d.shape;const p=d.holes;Wn.isClockWise(f)===!1&&(f=f.reverse());for(let g=0,m=p.length;g<m;g++){const v=p[g];Wn.isClockWise(v)===!0&&(p[g]=v.reverse())}const x=Wn.triangulateShape(f,p);for(let g=0,m=p.length;g<m;g++){const v=p[g];f=f.concat(v)}for(let g=0,m=f.length;g<m;g++){const v=f[g];s.push(v.x,v.y,0),r.push(0,0,1),a.push(v.x,v.y)}for(let g=0,m=x.length;g<m;g++){const v=x[g],M=v[0]+u,S=v[1]+u,R=v[2]+u;n.push(M,S,R),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes;return bf(e,t)}static fromJSON(t,e){const n=[];for(let s=0,r=t.shapes.length;s<r;s++){const a=e[t.shapes[s]];n.push(a)}return new Gs(n,t.curveSegments)}}function bf(i,t){if(t.shapes=[],Array.isArray(i))for(let e=0,n=i.length;e<n;e++){const s=i[e];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t}class Kn extends _e{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],u=new A,d=new A,f=[],p=[],x=[],g=[];for(let m=0;m<=n;m++){const v=[],M=m/n;let S=0;m===0&&a===0?S=.5/e:m===n&&l===Math.PI&&(S=-.5/e);for(let R=0;R<=e;R++){const E=R/e;u.x=-t*Math.cos(s+E*r)*Math.sin(a+M*o),u.y=t*Math.cos(a+M*o),u.z=t*Math.sin(s+E*r)*Math.sin(a+M*o),p.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),g.push(E+S,1-M),v.push(c++)}h.push(v)}for(let m=0;m<n;m++)for(let v=0;v<e;v++){const M=h[m][v+1],S=h[m][v],R=h[m+1][v],E=h[m+1][v+1];(m!==0||a>0)&&f.push(M,S,E),(m!==n-1||l<Math.PI)&&f.push(S,R,E)}this.setIndex(f),this.setAttribute("position",new ne(p,3)),this.setAttribute("normal",new ne(x,3)),this.setAttribute("uv",new ne(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Kn(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Tn extends _e{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);const l=[],c=[],h=[],u=[],d=new A,f=new A,p=new A;for(let x=0;x<=n;x++){const g=a+x/n*o;for(let m=0;m<=s;m++){const v=m/s*r;f.x=(t+e*Math.cos(g))*Math.cos(v),f.y=(t+e*Math.cos(g))*Math.sin(v),f.z=e*Math.sin(g),c.push(f.x,f.y,f.z),d.x=t*Math.cos(v),d.y=t*Math.sin(v),p.subVectors(f,d).normalize(),h.push(p.x,p.y,p.z),u.push(m/s),u.push(x/n)}}for(let x=1;x<=n;x++)for(let g=1;g<=s;g++){const m=(s+1)*x+g-1,v=(s+1)*(x-1)+g-1,M=(s+1)*(x-1)+g,S=(s+1)*x+g;l.push(m,v,S),l.push(v,M,S)}this.setIndex(l),this.setAttribute("position",new ne(c,3)),this.setAttribute("normal",new ne(h,3)),this.setAttribute("uv",new ne(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Tn(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class el extends _e{constructor(t=new tl(new A(-1,-1,0),new A(-1,1,0),new A(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};const a=t.computeFrenetFrames(e,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;const o=new A,l=new A,c=new ut;let h=new A;const u=[],d=[],f=[],p=[];x(),this.setIndex(p),this.setAttribute("position",new ne(u,3)),this.setAttribute("normal",new ne(d,3)),this.setAttribute("uv",new ne(f,2));function x(){for(let M=0;M<e;M++)g(M);g(r===!1?e:0),v(),m()}function g(M){h=t.getPointAt(M/e,h);const S=a.normals[M],R=a.binormals[M];for(let E=0;E<=s;E++){const P=E/s*Math.PI*2,y=Math.sin(P),T=-Math.cos(P);l.x=T*S.x+y*R.x,l.y=T*S.y+y*R.y,l.z=T*S.z+y*R.z,l.normalize(),d.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,u.push(o.x,o.y,o.z)}}function m(){for(let M=1;M<=e;M++)for(let S=1;S<=s;S++){const R=(s+1)*(M-1)+(S-1),E=(s+1)*M+(S-1),P=(s+1)*M+S,y=(s+1)*(M-1)+S;p.push(R,E,y),p.push(E,P,y)}}function v(){for(let M=0;M<=e;M++)for(let S=0;S<=s;S++)c.x=M/e,c.y=S/s,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new el(new Or[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}function as(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];if(tc(s))s.isRenderTargetTexture?(Ot("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(tc(s[0])){const r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function Ye(i){const t={};for(let e=0;e<i.length;e++){const n=as(i[e]);for(const s in n)t[s]=n[s]}return t}function tc(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function wf(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Fh(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:se.workingColorSpace}const Ef={clone:as,merge:Ye};var Tf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Af=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class an extends Di{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Tf,this.fragmentShader=Af,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=as(t.uniforms),this.uniformsGroups=wf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Cf extends an{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Ce extends Di{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Nt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=bo,this.normalScale=new ut(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new je,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class ec extends Ce{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ut(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Qt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Nt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Nt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Nt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class Rf extends Di{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Wu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Pf extends Di{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class nl extends Le{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Nt(t),this.intensity=e}dispose(){this.dispatchEvent({type:"dispose"})}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class Lf extends nl{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Le.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Nt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const Ma=new ee,nc=new A,ic=new A;class Oh{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ut(512,512),this.mapType=sn,this.map=null,this.mapPass=null,this.matrix=new ee,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Zo,this._frameExtents=new ut(1,1),this._viewportCount=1,this._viewports=[new Me(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;nc.setFromMatrixPosition(t.matrixWorld),e.position.copy(nc),ic.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(ic),e.updateMatrixWorld(),Ma.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ma,e.coordinateSystem,e.reversedDepth),e.coordinateSystem===Is||e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Ma)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const gr=new A,xr=new un,Mn=new A;class kh extends Le{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ee,this.projectionMatrix=new ee,this.projectionMatrixInverse=new ee,this.coordinateSystem=En,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(gr,xr,Mn),Mn.x===1&&Mn.y===1&&Mn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(gr,xr,Mn.set(1,1,1)).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorld.decompose(gr,xr,Mn),Mn.x===1&&Mn.y===1&&Mn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(gr,xr,Mn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const li=new A,sc=new ut,rc=new ut;class nn extends kh{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ds*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Es*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ds*2*Math.atan(Math.tan(Es*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){li.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(li.x,li.y).multiplyScalar(-t/li.z),li.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(li.x,li.y).multiplyScalar(-t/li.z)}getViewSize(t,e){return this.getViewBounds(t,sc,rc),e.subVectors(rc,sc)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Es*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class If extends Oh{constructor(){super(new nn(90,1,.5,500)),this.isPointLightShadow=!0}}class Df extends nl{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new If}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}}class il extends kh{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class Uf extends Oh{constructor(){super(new il(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class kr extends nl{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Le.DEFAULT_UP),this.updateMatrix(),this.target=new Le,this.shadow=new Uf}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}const Yi=-90,Zi=1;class Nf extends Le{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new nn(Yi,Zi,t,e);s.layers=this.layers,this.add(s);const r=new nn(Yi,Zi,t,e);r.layers=this.layers,this.add(r);const a=new nn(Yi,Zi,t,e);a.layers=this.layers,this.add(a);const o=new nn(Yi,Zi,t,e);o.layers=this.layers,this.add(o);const l=new nn(Yi,Zi,t,e);l.layers=this.layers,this.add(l);const c=new nn(Yi,Zi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===En)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Is)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),p=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=p,n.texture.needsPMREMUpdate=!0}}class Ff extends nn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class Bh{static{Bh.prototype.isMatrix2=!0}constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){const r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}}function ac(i,t,e,n){const s=Of(n);switch(e){case fh:return i*t;case Bo:return i*t/s.components*s.byteLength;case zo:return i*t/s.components*s.byteLength;case Ai:return i*t*2/s.components*s.byteLength;case Go:return i*t*2/s.components*s.byteLength;case ph:return i*t*3/s.components*s.byteLength;case xn:return i*t*4/s.components*s.byteLength;case Vo:return i*t*4/s.components*s.byteLength;case Sr:case br:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case wr:case Er:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case qa:case Za:return Math.max(i,16)*Math.max(t,8)/4;case $a:case Ya:return Math.max(i,8)*Math.max(t,8)/2;case Ka:case Ja:case Qa:case to:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ja:case Pr:case eo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case no:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case io:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case so:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ro:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case ao:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case oo:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case lo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case co:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case ho:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case uo:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case fo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case po:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case mo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case go:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case xo:case vo:case _o:return Math.ceil(i/4)*Math.ceil(t/4)*16;case yo:case Mo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Lr:case So:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Of(i){switch(i){case sn:case ch:return{byteLength:1,components:1};case Ps:case hh:case Yn:return{byteLength:2,components:1};case Oo:case ko:return{byteLength:2,components:4};case Ln:case Fo:case gn:return{byteLength:4,components:1};case uh:case dh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Uo}}));typeof window<"u"&&(window.__THREE__?Ot("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Uo);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function zh(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function kf(i){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,u=c.byteLength,d=i.createBuffer();i.bindBuffer(l,d),i.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){const h=l.array,u=l.updateRanges;if(i.bindBuffer(c,o),u.length===0)i.bufferSubData(c,0,h);else{u.sort((f,p)=>f.start-p.start);let d=0;for(let f=1;f<u.length;f++){const p=u[d],x=u[f];x.start<=p.start+p.count+1?p.count=Math.max(p.count,x.start+x.count-p.start):(++d,u[d]=x)}u.length=d+1;for(let f=0,p=u.length;f<p;f++){const x=u[f];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Bf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,zf=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Gf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Vf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Hf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Wf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Xf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,$f=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,qf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Yf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Zf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Kf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Jf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,jf=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Qf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,tp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ep=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,np=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ip=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,sp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,rp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,ap=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,op=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,lp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,hp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,up=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,dp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,fp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,pp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,mp="gl_FragColor = linearToOutputTexel( gl_FragColor );",gp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,xp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,vp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,_p=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,yp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Mp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Sp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,bp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,wp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ep=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Tp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ap=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Cp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Rp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Pp=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Lp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Ip=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Dp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Up=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Np=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Fp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Op=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,kp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = inverseTransformDirection( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Bp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,zp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Gp=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Vp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Hp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Xp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,$p=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,qp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Yp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Zp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Kp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Jp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,jp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Qp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,tm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,em=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,nm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,im=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,sm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,rm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,am=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,om=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,lm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,cm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,hm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,um=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,dm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,fm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,pm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,mm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,gm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,xm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,vm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,_m=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ym=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Mm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Sm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,bm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,wm=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Em=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Tm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Am=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Cm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Rm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Pm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Lm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Im=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Dm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Um=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Nm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Fm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Om=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,km=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Bm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,zm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Gm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Vm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Hm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Wm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,$m=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,qm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Ym=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Zm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Km=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,jm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,t0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,e0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,n0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,i0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,s0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,r0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,a0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,o0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,l0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,c0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,h0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,u0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,d0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,f0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,p0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,m0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,g0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,x0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,v0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Jt={alphahash_fragment:Bf,alphahash_pars_fragment:zf,alphamap_fragment:Gf,alphamap_pars_fragment:Vf,alphatest_fragment:Hf,alphatest_pars_fragment:Wf,aomap_fragment:Xf,aomap_pars_fragment:$f,batching_pars_vertex:qf,batching_vertex:Yf,begin_vertex:Zf,beginnormal_vertex:Kf,bsdfs:Jf,iridescence_fragment:jf,bumpmap_pars_fragment:Qf,clipping_planes_fragment:tp,clipping_planes_pars_fragment:ep,clipping_planes_pars_vertex:np,clipping_planes_vertex:ip,color_fragment:sp,color_pars_fragment:rp,color_pars_vertex:ap,color_vertex:op,common:lp,cube_uv_reflection_fragment:cp,defaultnormal_vertex:hp,displacementmap_pars_vertex:up,displacementmap_vertex:dp,emissivemap_fragment:fp,emissivemap_pars_fragment:pp,colorspace_fragment:mp,colorspace_pars_fragment:gp,envmap_fragment:xp,envmap_common_pars_fragment:vp,envmap_pars_fragment:_p,envmap_pars_vertex:yp,envmap_physical_pars_fragment:Lp,envmap_vertex:Mp,fog_vertex:Sp,fog_pars_vertex:bp,fog_fragment:wp,fog_pars_fragment:Ep,gradientmap_pars_fragment:Tp,lightmap_pars_fragment:Ap,lights_lambert_fragment:Cp,lights_lambert_pars_fragment:Rp,lights_pars_begin:Pp,lights_toon_fragment:Ip,lights_toon_pars_fragment:Dp,lights_phong_fragment:Up,lights_phong_pars_fragment:Np,lights_physical_fragment:Fp,lights_physical_pars_fragment:Op,lights_fragment_begin:kp,lights_fragment_maps:Bp,lights_fragment_end:zp,lightprobes_pars_fragment:Gp,logdepthbuf_fragment:Vp,logdepthbuf_pars_fragment:Hp,logdepthbuf_pars_vertex:Wp,logdepthbuf_vertex:Xp,map_fragment:$p,map_pars_fragment:qp,map_particle_fragment:Yp,map_particle_pars_fragment:Zp,metalnessmap_fragment:Kp,metalnessmap_pars_fragment:Jp,morphinstance_vertex:jp,morphcolor_vertex:Qp,morphnormal_vertex:tm,morphtarget_pars_vertex:em,morphtarget_vertex:nm,normal_fragment_begin:im,normal_fragment_maps:sm,normal_pars_fragment:rm,normal_pars_vertex:am,normal_vertex:om,normalmap_pars_fragment:lm,clearcoat_normal_fragment_begin:cm,clearcoat_normal_fragment_maps:hm,clearcoat_pars_fragment:um,iridescence_pars_fragment:dm,opaque_fragment:fm,packing:pm,premultiplied_alpha_fragment:mm,project_vertex:gm,dithering_fragment:xm,dithering_pars_fragment:vm,roughnessmap_fragment:_m,roughnessmap_pars_fragment:ym,shadowmap_pars_fragment:Mm,shadowmap_pars_vertex:Sm,shadowmap_vertex:bm,shadowmask_pars_fragment:wm,skinbase_vertex:Em,skinning_pars_vertex:Tm,skinning_vertex:Am,skinnormal_vertex:Cm,specularmap_fragment:Rm,specularmap_pars_fragment:Pm,tonemapping_fragment:Lm,tonemapping_pars_fragment:Im,transmission_fragment:Dm,transmission_pars_fragment:Um,uv_pars_fragment:Nm,uv_pars_vertex:Fm,uv_vertex:Om,worldpos_vertex:km,background_vert:Bm,background_frag:zm,backgroundCube_vert:Gm,backgroundCube_frag:Vm,cube_vert:Hm,cube_frag:Wm,depth_vert:Xm,depth_frag:$m,distance_vert:qm,distance_frag:Ym,equirect_vert:Zm,equirect_frag:Km,linedashed_vert:Jm,linedashed_frag:jm,meshbasic_vert:Qm,meshbasic_frag:t0,meshlambert_vert:e0,meshlambert_frag:n0,meshmatcap_vert:i0,meshmatcap_frag:s0,meshnormal_vert:r0,meshnormal_frag:a0,meshphong_vert:o0,meshphong_frag:l0,meshphysical_vert:c0,meshphysical_frag:h0,meshtoon_vert:u0,meshtoon_frag:d0,points_vert:f0,points_frag:p0,shadow_vert:m0,shadow_frag:g0,sprite_vert:x0,sprite_frag:v0},gt={common:{diffuse:{value:new Nt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new qt},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new qt}},envmap:{envMap:{value:null},envMapRotation:{value:new qt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new qt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new qt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new qt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new qt},normalScale:{value:new ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new qt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new qt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new qt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new qt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Nt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new A},probesMax:{value:new A},probesResolution:{value:new A}},points:{diffuse:{value:new Nt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0},uvTransform:{value:new qt}},sprite:{diffuse:{value:new Nt(16777215)},opacity:{value:1},center:{value:new ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new qt},alphaMap:{value:null},alphaMapTransform:{value:new qt},alphaTest:{value:0}}},wn={basic:{uniforms:Ye([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.fog]),vertexShader:Jt.meshbasic_vert,fragmentShader:Jt.meshbasic_frag},lambert:{uniforms:Ye([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new Nt(0)},envMapIntensity:{value:1}}]),vertexShader:Jt.meshlambert_vert,fragmentShader:Jt.meshlambert_frag},phong:{uniforms:Ye([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new Nt(0)},specular:{value:new Nt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Jt.meshphong_vert,fragmentShader:Jt.meshphong_frag},standard:{uniforms:Ye([gt.common,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.roughnessmap,gt.metalnessmap,gt.fog,gt.lights,{emissive:{value:new Nt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Jt.meshphysical_vert,fragmentShader:Jt.meshphysical_frag},toon:{uniforms:Ye([gt.common,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.gradientmap,gt.fog,gt.lights,{emissive:{value:new Nt(0)}}]),vertexShader:Jt.meshtoon_vert,fragmentShader:Jt.meshtoon_frag},matcap:{uniforms:Ye([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,{matcap:{value:null}}]),vertexShader:Jt.meshmatcap_vert,fragmentShader:Jt.meshmatcap_frag},points:{uniforms:Ye([gt.points,gt.fog]),vertexShader:Jt.points_vert,fragmentShader:Jt.points_frag},dashed:{uniforms:Ye([gt.common,gt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Jt.linedashed_vert,fragmentShader:Jt.linedashed_frag},depth:{uniforms:Ye([gt.common,gt.displacementmap]),vertexShader:Jt.depth_vert,fragmentShader:Jt.depth_frag},normal:{uniforms:Ye([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,{opacity:{value:1}}]),vertexShader:Jt.meshnormal_vert,fragmentShader:Jt.meshnormal_frag},sprite:{uniforms:Ye([gt.sprite,gt.fog]),vertexShader:Jt.sprite_vert,fragmentShader:Jt.sprite_frag},background:{uniforms:{uvTransform:{value:new qt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Jt.background_vert,fragmentShader:Jt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new qt}},vertexShader:Jt.backgroundCube_vert,fragmentShader:Jt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Jt.cube_vert,fragmentShader:Jt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Jt.equirect_vert,fragmentShader:Jt.equirect_frag},distance:{uniforms:Ye([gt.common,gt.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Jt.distance_vert,fragmentShader:Jt.distance_frag},shadow:{uniforms:Ye([gt.lights,gt.fog,{color:{value:new Nt(0)},opacity:{value:1}}]),vertexShader:Jt.shadow_vert,fragmentShader:Jt.shadow_frag}};wn.physical={uniforms:Ye([wn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new qt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new qt},clearcoatNormalScale:{value:new ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new qt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new qt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new qt},sheen:{value:0},sheenColor:{value:new Nt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new qt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new qt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new qt},transmissionSamplerSize:{value:new ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new qt},attenuationDistance:{value:0},attenuationColor:{value:new Nt(0)},specularColor:{value:new Nt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new qt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new qt},anisotropyVector:{value:new ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new qt}}]),vertexShader:Jt.meshphysical_vert,fragmentShader:Jt.meshphysical_frag};const vr={r:0,b:0,g:0},_0=new ee,Gh=new qt;Gh.set(-1,0,0,0,1,0,0,0,1);function y0(i,t,e,n,s,r){const a=new Nt(0);let o=s===!0?0:1,l,c,h=null,u=0,d=null;function f(v){let M=v.isScene===!0?v.background:null;if(M&&M.isTexture){const S=v.backgroundBlurriness>0;M=t.get(M,S)}return M}function p(v){let M=!1;const S=f(v);S===null?g(a,o):S&&S.isColor&&(g(S,1),M=!0);const R=i.xr.getEnvironmentBlendMode();R==="additive"?e.buffers.color.setClear(0,0,0,1,r):R==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||M)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function x(v,M){const S=f(M);S&&(S.isCubeTexture||S.mapping===Gr)?(c===void 0&&(c=new Tt(new Pe(1,1,1),new an({name:"BackgroundCubeMaterial",uniforms:as(wn.backgroundCube.uniforms),vertexShader:wn.backgroundCube.vertexShader,fragmentShader:wn.backgroundCube.fragmentShader,side:Xe,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(R,E,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=S,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(_0.makeRotationFromEuler(M.backgroundRotation)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Gh),c.material.toneMapped=se.getTransfer(S.colorSpace)!==he,(h!==S||u!==S.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,h=S,u=S.version,d=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new Tt(new Ae(2,2),new an({name:"BackgroundMaterial",uniforms:as(wn.background.uniforms),vertexShader:wn.background.vertexShader,fragmentShader:wn.background.fragmentShader,side:fi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=se.getTransfer(S.colorSpace)!==he,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(h!==S||u!==S.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,h=S,u=S.version,d=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function g(v,M){v.getRGB(vr,Fh(i)),e.buffers.color.setClear(vr.r,vr.g,vr.b,M,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,M=1){a.set(v),o=M,g(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,g(a,o)},render:p,addToRenderList:x,dispose:m}}function M0(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null);let r=s,a=!1;function o(C,N,H,W,D){let B=!1;const k=u(C,W,H,N);r!==k&&(r=k,c(r.object)),B=f(C,W,H,D),B&&p(C,W,H,D),D!==null&&t.update(D,i.ELEMENT_ARRAY_BUFFER),(B||a)&&(a=!1,S(C,N,H,W),D!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(D).buffer))}function l(){return i.createVertexArray()}function c(C){return i.bindVertexArray(C)}function h(C){return i.deleteVertexArray(C)}function u(C,N,H,W){const D=W.wireframe===!0;let B=n[N.id];B===void 0&&(B={},n[N.id]=B);const k=C.isInstancedMesh===!0?C.id:0;let J=B[k];J===void 0&&(J={},B[k]=J);let et=J[H.id];et===void 0&&(et={},J[H.id]=et);let dt=et[D];return dt===void 0&&(dt=d(l()),et[D]=dt),dt}function d(C){const N=[],H=[],W=[];for(let D=0;D<e;D++)N[D]=0,H[D]=0,W[D]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:H,attributeDivisors:W,object:C,attributes:{},index:null}}function f(C,N,H,W){const D=r.attributes,B=N.attributes;let k=0;const J=H.getAttributes();for(const et in J)if(J[et].location>=0){const yt=D[et];let At=B[et];if(At===void 0&&(et==="instanceMatrix"&&C.instanceMatrix&&(At=C.instanceMatrix),et==="instanceColor"&&C.instanceColor&&(At=C.instanceColor)),yt===void 0||yt.attribute!==At||At&&yt.data!==At.data)return!0;k++}return r.attributesNum!==k||r.index!==W}function p(C,N,H,W){const D={},B=N.attributes;let k=0;const J=H.getAttributes();for(const et in J)if(J[et].location>=0){let yt=B[et];yt===void 0&&(et==="instanceMatrix"&&C.instanceMatrix&&(yt=C.instanceMatrix),et==="instanceColor"&&C.instanceColor&&(yt=C.instanceColor));const At={};At.attribute=yt,yt&&yt.data&&(At.data=yt.data),D[et]=At,k++}r.attributes=D,r.attributesNum=k,r.index=W}function x(){const C=r.newAttributes;for(let N=0,H=C.length;N<H;N++)C[N]=0}function g(C){m(C,0)}function m(C,N){const H=r.newAttributes,W=r.enabledAttributes,D=r.attributeDivisors;H[C]=1,W[C]===0&&(i.enableVertexAttribArray(C),W[C]=1),D[C]!==N&&(i.vertexAttribDivisor(C,N),D[C]=N)}function v(){const C=r.newAttributes,N=r.enabledAttributes;for(let H=0,W=N.length;H<W;H++)N[H]!==C[H]&&(i.disableVertexAttribArray(H),N[H]=0)}function M(C,N,H,W,D,B,k){k===!0?i.vertexAttribIPointer(C,N,H,D,B):i.vertexAttribPointer(C,N,H,W,D,B)}function S(C,N,H,W){x();const D=W.attributes,B=H.getAttributes(),k=N.defaultAttributeValues;for(const J in B){const et=B[J];if(et.location>=0){let dt=D[J];if(dt===void 0&&(J==="instanceMatrix"&&C.instanceMatrix&&(dt=C.instanceMatrix),J==="instanceColor"&&C.instanceColor&&(dt=C.instanceColor)),dt!==void 0){const yt=dt.normalized,At=dt.itemSize,$t=t.get(dt);if($t===void 0)continue;const ie=$t.buffer,Bt=$t.type,Y=$t.bytesPerElement,pt=Bt===i.INT||Bt===i.UNSIGNED_INT||dt.gpuType===Fo;if(dt.isInterleavedBufferAttribute){const it=dt.data,Ct=it.stride,Ft=dt.offset;if(it.isInstancedInterleavedBuffer){for(let kt=0;kt<et.locationSize;kt++)m(et.location+kt,it.meshPerAttribute);C.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=it.meshPerAttribute*it.count)}else for(let kt=0;kt<et.locationSize;kt++)g(et.location+kt);i.bindBuffer(i.ARRAY_BUFFER,ie);for(let kt=0;kt<et.locationSize;kt++)M(et.location+kt,At/et.locationSize,Bt,yt,Ct*Y,(Ft+At/et.locationSize*kt)*Y,pt)}else{if(dt.isInstancedBufferAttribute){for(let it=0;it<et.locationSize;it++)m(et.location+it,dt.meshPerAttribute);C.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=dt.meshPerAttribute*dt.count)}else for(let it=0;it<et.locationSize;it++)g(et.location+it);i.bindBuffer(i.ARRAY_BUFFER,ie);for(let it=0;it<et.locationSize;it++)M(et.location+it,At/et.locationSize,Bt,yt,At*Y,At/et.locationSize*it*Y,pt)}}else if(k!==void 0){const yt=k[J];if(yt!==void 0)switch(yt.length){case 2:i.vertexAttrib2fv(et.location,yt);break;case 3:i.vertexAttrib3fv(et.location,yt);break;case 4:i.vertexAttrib4fv(et.location,yt);break;default:i.vertexAttrib1fv(et.location,yt)}}}}v()}function R(){T();for(const C in n){const N=n[C];for(const H in N){const W=N[H];for(const D in W){const B=W[D];for(const k in B)h(B[k].object),delete B[k];delete W[D]}}delete n[C]}}function E(C){if(n[C.id]===void 0)return;const N=n[C.id];for(const H in N){const W=N[H];for(const D in W){const B=W[D];for(const k in B)h(B[k].object),delete B[k];delete W[D]}}delete n[C.id]}function P(C){for(const N in n){const H=n[N];for(const W in H){const D=H[W];if(D[C.id]===void 0)continue;const B=D[C.id];for(const k in B)h(B[k].object),delete B[k];delete D[C.id]}}}function y(C){for(const N in n){const H=n[N],W=C.isInstancedMesh===!0?C.id:0,D=H[W];if(D!==void 0){for(const B in D){const k=D[B];for(const J in k)h(k[J].object),delete k[J];delete D[B]}delete H[W],Object.keys(H).length===0&&delete n[N]}}}function T(){I(),a=!0,r!==s&&(r=s,c(r.object))}function I(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:T,resetDefaultState:I,dispose:R,releaseStatesOfGeometry:E,releaseStatesOfObject:y,releaseStatesOfProgram:P,initAttributes:x,enableAttribute:g,disableUnusedAttributes:v}}function S0(i,t,e){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let d=0;for(let f=0;f<h;f++)d+=c[f];e.update(d,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function b0(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const P=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(P){return!(P!==xn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(P){const y=P===Yn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(P!==sn&&n.convert(P)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==gn&&!y)}function l(P){if(P==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(Ot("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=e.logarithmicDepthBuffer===!0,d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&d===!1&&Ot("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),R=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:p,maxTextureSize:x,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:v,maxVaryings:M,maxFragmentUniforms:S,maxSamples:R,samples:E}}function w0(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new _i,o=new qt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||n!==0||s;return s=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){const p=u.clippingPlanes,x=u.clipIntersection,g=u.clipShadows,m=i.get(u);if(!s||p===null||p.length===0||r&&!g)r?h(null):c();else{const v=r?0:n,M=v*4;let S=m.clippingState||null;l.value=S,S=h(p,d,M,f);for(let R=0;R!==M;++R)S[R]=e[R];m.clippingState=S,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,d,f,p){const x=u!==null?u.length:0;let g=null;if(x!==0){if(g=l.value,p!==!0||g===null){const m=f+x*4,v=d.matrixWorldInverse;o.getNormalMatrix(v),(g===null||g.length<m)&&(g=new Float32Array(m));for(let M=0,S=f;M!==x;++M,S+=4)a.copy(u[M]).applyMatrix4(v,o),a.normal.toArray(g,S),g[S+3]=a.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,g}}const ui=4,oc=[.125,.215,.35,.446,.526,.582],Mi=20,E0=256,xs=new il,lc=new Nt;let Sa=null,ba=0,wa=0,Ea=!1;const T0=new A;class cc{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){const{size:a=256,position:o=T0}=r;Sa=this._renderer.getRenderTarget(),ba=this._renderer.getActiveCubeFace(),wa=this._renderer.getActiveMipmapLevel(),Ea=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=dc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=uc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Sa,ba,wa),this._renderer.xr.enabled=Ea,t.scissorTest=!1,Ki(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ei||t.mapping===is?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Sa=this._renderer.getRenderTarget(),ba=this._renderer.getActiveCubeFace(),wa=this._renderer.getActiveMipmapLevel(),Ea=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:We,minFilter:We,generateMipmaps:!1,type:Yn,format:xn,colorSpace:Ir,depthBuffer:!1},s=hc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=hc(t,e,n);const{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=A0(r)),this._blurMaterial=R0(r,t,e),this._ggxMaterial=C0(r,t,e)}return s}_compileMaterial(t){const e=new Tt(new _e,t);this._renderer.compile(e,xs)}_sceneToCubeUV(t,e,n,s,r){const l=new nn(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,f=u.toneMapping;u.getClearColor(lc),u.toneMapping=An,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(s),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Tt(new Pe,new Oe({name:"PMREM.Background",side:Xe,depthWrite:!1,depthTest:!1})));const x=this._backgroundBox,g=x.material;let m=!1;const v=t.background;v?v.isColor&&(g.color.copy(v),t.background=null,m=!0):(g.color.copy(lc),m=!0);for(let M=0;M<6;M++){const S=M%3;S===0?(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[M],r.y,r.z)):S===1?(l.up.set(0,0,c[M]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[M],r.z)):(l.up.set(0,c[M],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[M]));const R=this._cubeSize;Ki(s,S*R,M>2?R:0,R,R),u.setRenderTarget(s),m&&u.render(x,l),u.render(t,l)}u.toneMapping=f,u.autoClear=d,t.background=v}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Ei||t.mapping===is;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=dc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=uc());const r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;const o=r.uniforms;o.envMap.value=t;const l=this._cubeSize;Ki(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,xs)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){const s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const l=a.uniforms,c=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),d=0+c*1.25,f=u*d,{_lodMax:p}=this,x=this._sizeLods[n],g=3*x*(n>p-ui?n-p+ui:0),m=4*(this._cubeSize-x);l.envMap.value=t.texture,l.roughness.value=f,l.mipInt.value=p-e,Ki(r,g,m,3*x,2*x),s.setRenderTarget(r),s.render(o,xs),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=p-n,Ki(t,g,m,3*x,2*x),s.setRenderTarget(t),s.render(o,xs)}_blur(t,e,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&re("blur direction must be either latitudinal or longitudinal!");const h=3,u=this._lodMeshes[s];u.material=c;const d=c.uniforms,f=this._sizeLods[n]-1,p=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Mi-1),x=r/p,g=isFinite(r)?1+Math.floor(h*x):Mi;g>Mi&&Ot(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Mi}`);const m=[];let v=0;for(let P=0;P<Mi;++P){const y=P/x,T=Math.exp(-y*y/2);m.push(T),P===0?v+=T:P<g&&(v+=2*T)}for(let P=0;P<m.length;P++)m[P]=m[P]/v;d.envMap.value=t.texture,d.samples.value=g,d.weights.value=m,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:M}=this;d.dTheta.value=p,d.mipInt.value=M-n;const S=this._sizeLods[s],R=3*S*(s>M-ui?s-M+ui:0),E=4*(this._cubeSize-S);Ki(e,R,E,3*S,2*S),l.setRenderTarget(e),l.render(u,xs)}}function A0(i){const t=[],e=[],n=[];let s=i;const r=i-ui+1+oc.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);t.push(o);let l=1/o;a>i-ui?l=oc[a-i+ui-1]:a===0&&(l=0),e.push(l);const c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,p=6,x=3,g=2,m=1,v=new Float32Array(x*p*f),M=new Float32Array(g*p*f),S=new Float32Array(m*p*f);for(let E=0;E<f;E++){const P=E%3*2/3-1,y=E>2?0:-1,T=[P,y,0,P+2/3,y,0,P+2/3,y+1,0,P,y,0,P+2/3,y+1,0,P,y+1,0];v.set(T,x*p*E),M.set(d,g*p*E);const I=[E,E,E,E,E,E];S.set(I,m*p*E)}const R=new _e;R.setAttribute("position",new Ze(v,x)),R.setAttribute("uv",new Ze(M,g)),R.setAttribute("faceIndex",new Ze(S,m)),n.push(new Tt(R,null)),s>ui&&s--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function hc(i,t,e){const n=new Cn(i,t,e);return n.texture.mapping=Gr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ki(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function C0(i,t,e){return new an({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:E0,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Vr(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function R0(i,t,e){const n=new Float32Array(Mi),s=new A(0,1,0);return new an({name:"SphericalGaussianBlur",defines:{n:Mi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Vr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function uc(){return new an({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Vr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function dc(){return new an({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Vr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Xn,depthTest:!1,depthWrite:!1})}function Vr(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class Vh extends Cn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Eh(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Pe(5,5,5),r=new an({name:"CubemapFromEquirect",uniforms:as(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Xe,blending:Xn});r.uniforms.tEquirect.value=e;const a=new Tt(s,r),o=e.minFilter;return e.minFilter===Si&&(e.minFilter=We),new Nf(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}function P0(i){let t=new WeakMap,e=new WeakMap,n=null;function s(d,f=!1){return d==null?null:f?a(d):r(d)}function r(d){if(d&&d.isTexture){const f=d.mapping;if(f===$r||f===qr)if(t.has(d)){const p=t.get(d).texture;return o(p,d.mapping)}else{const p=d.image;if(p&&p.height>0){const x=new Vh(p.height);return x.fromEquirectangularTexture(i,d),t.set(d,x),d.addEventListener("dispose",c),o(x.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture){const f=d.mapping,p=f===$r||f===qr,x=f===Ei||f===is;if(p||x){let g=e.get(d);const m=g!==void 0?g.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==m)return n===null&&(n=new cc(i)),g=p?n.fromEquirectangular(d,g):n.fromCubemap(d,g),g.texture.pmremVersion=d.pmremVersion,e.set(d,g),g.texture;if(g!==void 0)return g.texture;{const v=d.image;return p&&v&&v.height>0||x&&v&&l(v)?(n===null&&(n=new cc(i)),g=p?n.fromEquirectangular(d):n.fromCubemap(d),g.texture.pmremVersion=d.pmremVersion,e.set(d,g),d.addEventListener("dispose",h),g.texture):null}}}return d}function o(d,f){return f===$r?d.mapping=Ei:f===qr&&(d.mapping=is),d}function l(d){let f=0;const p=6;for(let x=0;x<p;x++)d[x]!==void 0&&f++;return f===p}function c(d){const f=d.target;f.removeEventListener("dispose",c);const p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function h(d){const f=d.target;f.removeEventListener("dispose",h);const p=e.get(f);p!==void 0&&(e.delete(f),p.dispose())}function u(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:u}}function L0(i){const t={};function e(n){if(t[n]!==void 0)return t[n];const s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&wo("WebGLRenderer: "+n+" extension not supported."),s}}}function I0(i,t,e,n){const s={},r=new WeakMap;function a(u){const d=u.target;d.index!==null&&t.remove(d.index);for(const p in d.attributes)t.remove(d.attributes[p]);d.removeEventListener("dispose",a),delete s[d.id];const f=r.get(d);f&&(t.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(u,d){return s[d.id]===!0||(d.addEventListener("dispose",a),s[d.id]=!0,e.memory.geometries++),d}function l(u){const d=u.attributes;for(const f in d)t.update(d[f],i.ARRAY_BUFFER)}function c(u){const d=[],f=u.index,p=u.attributes.position;let x=0;if(p===void 0)return;if(f!==null){const v=f.array;x=f.version;for(let M=0,S=v.length;M<S;M+=3){const R=v[M+0],E=v[M+1],P=v[M+2];d.push(R,E,E,P,P,R)}}else{const v=p.array;x=p.version;for(let M=0,S=v.length/3-1;M<S;M+=3){const R=M+0,E=M+1,P=M+2;d.push(R,E,E,P,P,R)}}const g=new(p.count>=65535?Mh:yh)(d,1);g.version=x;const m=r.get(u);m&&t.remove(m),r.set(u,g)}function h(u){const d=r.get(u);if(d){const f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function D0(i,t,e){let n;function s(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,d){i.drawElements(n,d,r,u*a),e.update(d,n,1)}function c(u,d,f){f!==0&&(i.drawElementsInstanced(n,d,r,u*a,f),e.update(d,n,f))}function h(u,d,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,u,0,f);let x=0;for(let g=0;g<f;g++)x+=d[g];e.update(x,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function U0(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:re("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function N0(i,t,e){const n=new WeakMap,s=new Me;function r(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(o);if(d===void 0||d.count!==u){let I=function(){y.dispose(),n.delete(o),o.removeEventListener("dispose",I)};var f=I;d!==void 0&&d.texture.dispose();const p=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,g=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],v=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let S=0;p===!0&&(S=1),x===!0&&(S=2),g===!0&&(S=3);let R=o.attributes.position.count*S,E=1;R>t.maxTextureSize&&(E=Math.ceil(R/t.maxTextureSize),R=t.maxTextureSize);const P=new Float32Array(R*E*4*u),y=new xh(P,R,E,u);y.type=gn,y.needsUpdate=!0;const T=S*4;for(let C=0;C<u;C++){const N=m[C],H=v[C],W=M[C],D=R*E*4*C;for(let B=0;B<N.count;B++){const k=B*T;p===!0&&(s.fromBufferAttribute(N,B),P[D+k+0]=s.x,P[D+k+1]=s.y,P[D+k+2]=s.z,P[D+k+3]=0),x===!0&&(s.fromBufferAttribute(H,B),P[D+k+4]=s.x,P[D+k+5]=s.y,P[D+k+6]=s.z,P[D+k+7]=0),g===!0&&(s.fromBufferAttribute(W,B),P[D+k+8]=s.x,P[D+k+9]=s.y,P[D+k+10]=s.z,P[D+k+11]=W.itemSize===4?s.w:1)}}d={count:u,texture:y,size:new ut(R,E)},n.set(o,d),o.addEventListener("dispose",I)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let p=0;for(let g=0;g<c.length;g++)p+=c[g];const x=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function F0(i,t,e,n,s){let r=new WeakMap;function a(c){const h=s.render.frame,u=c.geometry,d=t.get(c,u);if(r.get(d)!==h&&(t.update(d),r.set(d,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){const f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return d}function o(){r=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}const O0={[nh]:"LINEAR_TONE_MAPPING",[ih]:"REINHARD_TONE_MAPPING",[sh]:"CINEON_TONE_MAPPING",[No]:"ACES_FILMIC_TONE_MAPPING",[ah]:"AGX_TONE_MAPPING",[oh]:"NEUTRAL_TONE_MAPPING",[rh]:"CUSTOM_TONE_MAPPING"};function k0(i,t,e,n,s){const r=new Cn(t,e,{type:i,depthBuffer:n,stencilBuffer:s,depthTexture:n?new ss(t,e):void 0}),a=new Cn(t,e,{type:Yn,depthBuffer:!1,stencilBuffer:!1}),o=new _e;o.setAttribute("position",new ne([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new ne([0,2,0,0,2,0],2));const l=new Cf({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),c=new Tt(o,l),h=new il(-1,1,1,-1,0,1);let u=null,d=null,f=!1,p,x=null,g=[],m=!1;this.setSize=function(v,M){r.setSize(v,M),a.setSize(v,M);for(let S=0;S<g.length;S++){const R=g[S];R.setSize&&R.setSize(v,M)}},this.setEffects=function(v){g=v,m=g.length>0&&g[0].isRenderPass===!0;const M=r.width,S=r.height;for(let R=0;R<g.length;R++){const E=g[R];E.setSize&&E.setSize(M,S)}},this.begin=function(v,M){if(f||v.toneMapping===An&&g.length===0)return!1;if(x=M,M!==null){const S=M.width,R=M.height;(r.width!==S||r.height!==R)&&this.setSize(S,R)}return m===!1&&v.setRenderTarget(r),p=v.toneMapping,v.toneMapping=An,!0},this.hasRenderPass=function(){return m},this.end=function(v,M){v.toneMapping=p,f=!0;let S=r,R=a;for(let E=0;E<g.length;E++){const P=g[E];if(P.enabled!==!1&&(P.render(v,R,S,M),P.needsSwap!==!1)){const y=S;S=R,R=y}}if(u!==v.outputColorSpace||d!==v.toneMapping){u=v.outputColorSpace,d=v.toneMapping,l.defines={},se.getTransfer(u)===he&&(l.defines.SRGB_TRANSFER="");const E=O0[d];E&&(l.defines[E]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=S.texture,v.setRenderTarget(x),v.render(c,h),x=null,f=!1},this.isCompositing=function(){return f},this.dispose=function(){r.depthTexture&&r.depthTexture.dispose(),r.dispose(),a.dispose(),o.dispose(),l.dispose()}}const Hh=new $e,Ro=new ss(1,1),Wh=new xh,Xh=new bd,$h=new Eh,fc=[],pc=[],mc=new Float32Array(16),gc=new Float32Array(9),xc=new Float32Array(4);function cs(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=fc[s];if(r===void 0&&(r=new Float32Array(s),fc[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function Ie(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function De(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Hr(i,t){let e=pc[t];e===void 0&&(e=new Int32Array(t),pc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function B0(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function z0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ie(e,t))return;i.uniform2fv(this.addr,t),De(e,t)}}function G0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ie(e,t))return;i.uniform3fv(this.addr,t),De(e,t)}}function V0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ie(e,t))return;i.uniform4fv(this.addr,t),De(e,t)}}function H0(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ie(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),De(e,t)}else{if(Ie(e,n))return;xc.set(n),i.uniformMatrix2fv(this.addr,!1,xc),De(e,n)}}function W0(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ie(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),De(e,t)}else{if(Ie(e,n))return;gc.set(n),i.uniformMatrix3fv(this.addr,!1,gc),De(e,n)}}function X0(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ie(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),De(e,t)}else{if(Ie(e,n))return;mc.set(n),i.uniformMatrix4fv(this.addr,!1,mc),De(e,n)}}function $0(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function q0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ie(e,t))return;i.uniform2iv(this.addr,t),De(e,t)}}function Y0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ie(e,t))return;i.uniform3iv(this.addr,t),De(e,t)}}function Z0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ie(e,t))return;i.uniform4iv(this.addr,t),De(e,t)}}function K0(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function J0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ie(e,t))return;i.uniform2uiv(this.addr,t),De(e,t)}}function j0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ie(e,t))return;i.uniform3uiv(this.addr,t),De(e,t)}}function Q0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ie(e,t))return;i.uniform4uiv(this.addr,t),De(e,t)}}function tg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ro.compareFunction=e.isReversedDepthBuffer()?Wo:Ho,r=Ro):r=Hh,e.setTexture2D(t||r,s)}function eg(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Xh,s)}function ng(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||$h,s)}function ig(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Wh,s)}function sg(i){switch(i){case 5126:return B0;case 35664:return z0;case 35665:return G0;case 35666:return V0;case 35674:return H0;case 35675:return W0;case 35676:return X0;case 5124:case 35670:return $0;case 35667:case 35671:return q0;case 35668:case 35672:return Y0;case 35669:case 35673:return Z0;case 5125:return K0;case 36294:return J0;case 36295:return j0;case 36296:return Q0;case 35678:case 36198:case 36298:case 36306:case 35682:return tg;case 35679:case 36299:case 36307:return eg;case 35680:case 36300:case 36308:case 36293:return ng;case 36289:case 36303:case 36311:case 36292:return ig}}function rg(i,t){i.uniform1fv(this.addr,t)}function ag(i,t){const e=cs(t,this.size,2);i.uniform2fv(this.addr,e)}function og(i,t){const e=cs(t,this.size,3);i.uniform3fv(this.addr,e)}function lg(i,t){const e=cs(t,this.size,4);i.uniform4fv(this.addr,e)}function cg(i,t){const e=cs(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function hg(i,t){const e=cs(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function ug(i,t){const e=cs(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function dg(i,t){i.uniform1iv(this.addr,t)}function fg(i,t){i.uniform2iv(this.addr,t)}function pg(i,t){i.uniform3iv(this.addr,t)}function mg(i,t){i.uniform4iv(this.addr,t)}function gg(i,t){i.uniform1uiv(this.addr,t)}function xg(i,t){i.uniform2uiv(this.addr,t)}function vg(i,t){i.uniform3uiv(this.addr,t)}function _g(i,t){i.uniform4uiv(this.addr,t)}function yg(i,t,e){const n=this.cache,s=t.length,r=Hr(e,s);Ie(n,r)||(i.uniform1iv(this.addr,r),De(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=Ro:a=Hh;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function Mg(i,t,e){const n=this.cache,s=t.length,r=Hr(e,s);Ie(n,r)||(i.uniform1iv(this.addr,r),De(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Xh,r[a])}function Sg(i,t,e){const n=this.cache,s=t.length,r=Hr(e,s);Ie(n,r)||(i.uniform1iv(this.addr,r),De(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||$h,r[a])}function bg(i,t,e){const n=this.cache,s=t.length,r=Hr(e,s);Ie(n,r)||(i.uniform1iv(this.addr,r),De(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Wh,r[a])}function wg(i){switch(i){case 5126:return rg;case 35664:return ag;case 35665:return og;case 35666:return lg;case 35674:return cg;case 35675:return hg;case 35676:return ug;case 5124:case 35670:return dg;case 35667:case 35671:return fg;case 35668:case 35672:return pg;case 35669:case 35673:return mg;case 5125:return gg;case 36294:return xg;case 36295:return vg;case 36296:return _g;case 35678:case 36198:case 36298:case 36306:case 35682:return yg;case 35679:case 36299:case 36307:return Mg;case 35680:case 36300:case 36308:case 36293:return Sg;case 36289:case 36303:case 36311:case 36292:return bg}}class Eg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=sg(e.type)}}class Tg{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=wg(e.type)}}class Ag{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const Ta=/(\w+)(\])?(\[|\.)?/g;function vc(i,t){i.seq.push(t),i.map[t.id]=t}function Cg(i,t,e){const n=i.name,s=n.length;for(Ta.lastIndex=0;;){const r=Ta.exec(n),a=Ta.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){vc(e,c===void 0?new Eg(o,i,t):new Tg(o,i,t));break}else{let u=e.map[o];u===void 0&&(u=new Ag(o),vc(e,u)),e=u}}}class Tr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);Cg(o,l,this)}const s=[],r=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function _c(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Rg=37297;let Pg=0;function Lg(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const yc=new qt;function Ig(i){se._getMatrix(yc,se.workingColorSpace,i);const t=`mat3( ${yc.elements.map(e=>e.toFixed(4))} )`;switch(se.getTransfer(i)){case Dr:return[t,"LinearTransferOETF"];case he:return[t,"sRGBTransferOETF"];default:return Ot("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Mc(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+Lg(i.getShaderSource(t),o)}else return r}function Dg(i,t){const e=Ig(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const Ug={[nh]:"Linear",[ih]:"Reinhard",[sh]:"Cineon",[No]:"ACESFilmic",[ah]:"AgX",[oh]:"Neutral",[rh]:"Custom"};function Ng(i,t){const e=Ug[t];return e===void 0?(Ot("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const _r=new A;function Fg(){se.getLuminanceCoefficients(_r);const i=_r.x.toFixed(4),t=_r.y.toFixed(4),e=_r.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Og(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(bs).join(`
`)}function kg(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Bg(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function bs(i){return i!==""}function Sc(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function bc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const zg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Po(i){return i.replace(zg,Vg)}const Gg=new Map;function Vg(i,t){let e=Jt[t];if(e===void 0){const n=Gg.get(t);if(n!==void 0)e=Jt[n],Ot('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Po(e)}const Hg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function wc(i){return i.replace(Hg,Wg)}function Wg(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Ec(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const Xg={[ws]:"SHADOWMAP_TYPE_PCF",[Ms]:"SHADOWMAP_TYPE_VSM"};function $g(i){return Xg[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const qg={[Ei]:"ENVMAP_TYPE_CUBE",[is]:"ENVMAP_TYPE_CUBE",[Gr]:"ENVMAP_TYPE_CUBE_UV"};function Yg(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":qg[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const Zg={[is]:"ENVMAP_MODE_REFRACTION"};function Kg(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Zg[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Jg={[eh]:"ENVMAP_BLENDING_MULTIPLY",[Gu]:"ENVMAP_BLENDING_MIX",[Vu]:"ENVMAP_BLENDING_ADD"};function jg(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Jg[i.combine]||"ENVMAP_BLENDING_NONE"}function Qg(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function tx(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=$g(e),c=Yg(e),h=Kg(e),u=jg(e),d=Qg(e),f=Og(e),p=kg(r),x=s.createProgram();let g,m,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(bs).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(bs).join(`
`),m.length>0&&(m+=`
`)):(g=[Ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(bs).join(`
`),m=[Ec(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==An?"#define TONE_MAPPING":"",e.toneMapping!==An?Jt.tonemapping_pars_fragment:"",e.toneMapping!==An?Ng("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Jt.colorspace_pars_fragment,Dg("linearToOutputTexel",e.outputColorSpace),Fg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(bs).join(`
`)),a=Po(a),a=Sc(a,e),a=bc(a,e),o=Po(o),o=Sc(o,e),o=bc(o,e),a=wc(a),o=wc(o),e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",e.glslVersion===Ml?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ml?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const M=v+g+a,S=v+m+o,R=_c(s,s.VERTEX_SHADER,M),E=_c(s,s.FRAGMENT_SHADER,S);s.attachShader(x,R),s.attachShader(x,E),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function P(C){if(i.debug.checkShaderErrors){const N=s.getProgramInfoLog(x)||"",H=s.getShaderInfoLog(R)||"",W=s.getShaderInfoLog(E)||"",D=N.trim(),B=H.trim(),k=W.trim();let J=!0,et=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,R,E);else{const dt=Mc(s,R,"vertex"),yt=Mc(s,E,"fragment");re("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+D+`
`+dt+`
`+yt)}else D!==""?Ot("WebGLProgram: Program Info Log:",D):(B===""||k==="")&&(et=!1);et&&(C.diagnostics={runnable:J,programLog:D,vertexShader:{log:B,prefix:g},fragmentShader:{log:k,prefix:m}})}s.deleteShader(R),s.deleteShader(E),y=new Tr(s,x),T=Bg(s,x)}let y;this.getUniforms=function(){return y===void 0&&P(this),y};let T;this.getAttributes=function(){return T===void 0&&P(this),T};let I=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=s.getProgramParameter(x,Rg)),I},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Pg++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=R,this.fragmentShader=E,this}let ex=0;class nx{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new ix(t),e.set(t,n)),n}}class ix{constructor(t){this.id=ex++,this.code=t,this.usedTimes=0}}function sx(i){return i===Ai||i===Pr||i===Lr}function rx(i,t,e,n,s,r){const a=new vh,o=new nx,l=new Set,c=[],h=new Map,u=n.logarithmicDepthBuffer;let d=n.precision;const f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(y){return l.add(y),y===0?"uv":`uv${y}`}function x(y,T,I,C,N,H){const W=C.fog,D=N.geometry,B=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?C.environment:null,k=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,J=t.get(y.envMap||B,k),et=J&&J.mapping===Gr?J.image.height:null,dt=f[y.type];y.precision!==null&&(d=n.getMaxPrecision(y.precision),d!==y.precision&&Ot("WebGLProgram.getParameters:",y.precision,"not supported, using",d,"instead."));const yt=D.morphAttributes.position||D.morphAttributes.normal||D.morphAttributes.color,At=yt!==void 0?yt.length:0;let $t=0;D.morphAttributes.position!==void 0&&($t=1),D.morphAttributes.normal!==void 0&&($t=2),D.morphAttributes.color!==void 0&&($t=3);let ie,Bt,Y,pt;if(dt){const Yt=wn[dt];ie=Yt.vertexShader,Bt=Yt.fragmentShader}else ie=y.vertexShader,Bt=y.fragmentShader,o.update(y),Y=o.getVertexShaderID(y),pt=o.getFragmentShaderID(y);const it=i.getRenderTarget(),Ct=i.state.buffers.depth.getReversed(),Ft=N.isInstancedMesh===!0,kt=N.isBatchedMesh===!0,ae=!!y.map,Gt=!!y.matcap,K=!!J,nt=!!y.aoMap,j=!!y.lightMap,vt=!!y.bumpMap,ft=!!y.normalMap,Vt=!!y.displacementMap,L=!!y.emissiveMap,Wt=!!y.metalnessMap,Rt=!!y.roughnessMap,Ht=y.anisotropy>0,st=y.clearcoat>0,ce=y.dispersion>0,w=y.iridescence>0,_=y.sheen>0,O=y.transmission>0,q=Ht&&!!y.anisotropyMap,Q=st&&!!y.clearcoatMap,rt=st&&!!y.clearcoatNormalMap,lt=st&&!!y.clearcoatRoughnessMap,X=w&&!!y.iridescenceMap,Z=w&&!!y.iridescenceThicknessMap,Mt=_&&!!y.sheenColorMap,wt=_&&!!y.sheenRoughnessMap,ct=!!y.specularMap,at=!!y.specularColorMap,Xt=!!y.specularIntensityMap,Kt=O&&!!y.transmissionMap,le=O&&!!y.thicknessMap,U=!!y.gradientMap,ot=!!y.alphaMap,$=y.alphaTest>0,St=!!y.alphaHash,ht=!!y.extensions;let tt=An;y.toneMapped&&(it===null||it.isXRRenderTarget===!0)&&(tt=i.toneMapping);const It={shaderID:dt,shaderType:y.type,shaderName:y.name,vertexShader:ie,fragmentShader:Bt,defines:y.defines,customVertexShaderID:Y,customFragmentShaderID:pt,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:d,batching:kt,batchingColor:kt&&N._colorsTexture!==null,instancing:Ft,instancingColor:Ft&&N.instanceColor!==null,instancingMorph:Ft&&N.morphTexture!==null,outputColorSpace:it===null?i.outputColorSpace:it.isXRRenderTarget===!0?it.texture.colorSpace:se.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:ae,matcap:Gt,envMap:K,envMapMode:K&&J.mapping,envMapCubeUVHeight:et,aoMap:nt,lightMap:j,bumpMap:vt,normalMap:ft,displacementMap:Vt,emissiveMap:L,normalMapObjectSpace:ft&&y.normalMapType===Xu,normalMapTangentSpace:ft&&y.normalMapType===bo,packedNormalMap:ft&&y.normalMapType===bo&&sx(y.normalMap.format),metalnessMap:Wt,roughnessMap:Rt,anisotropy:Ht,anisotropyMap:q,clearcoat:st,clearcoatMap:Q,clearcoatNormalMap:rt,clearcoatRoughnessMap:lt,dispersion:ce,iridescence:w,iridescenceMap:X,iridescenceThicknessMap:Z,sheen:_,sheenColorMap:Mt,sheenRoughnessMap:wt,specularMap:ct,specularColorMap:at,specularIntensityMap:Xt,transmission:O,transmissionMap:Kt,thicknessMap:le,gradientMap:U,opaque:y.transparent===!1&&y.blending===ji&&y.alphaToCoverage===!1,alphaMap:ot,alphaTest:$,alphaHash:St,combine:y.combine,mapUv:ae&&p(y.map.channel),aoMapUv:nt&&p(y.aoMap.channel),lightMapUv:j&&p(y.lightMap.channel),bumpMapUv:vt&&p(y.bumpMap.channel),normalMapUv:ft&&p(y.normalMap.channel),displacementMapUv:Vt&&p(y.displacementMap.channel),emissiveMapUv:L&&p(y.emissiveMap.channel),metalnessMapUv:Wt&&p(y.metalnessMap.channel),roughnessMapUv:Rt&&p(y.roughnessMap.channel),anisotropyMapUv:q&&p(y.anisotropyMap.channel),clearcoatMapUv:Q&&p(y.clearcoatMap.channel),clearcoatNormalMapUv:rt&&p(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:lt&&p(y.clearcoatRoughnessMap.channel),iridescenceMapUv:X&&p(y.iridescenceMap.channel),iridescenceThicknessMapUv:Z&&p(y.iridescenceThicknessMap.channel),sheenColorMapUv:Mt&&p(y.sheenColorMap.channel),sheenRoughnessMapUv:wt&&p(y.sheenRoughnessMap.channel),specularMapUv:ct&&p(y.specularMap.channel),specularColorMapUv:at&&p(y.specularColorMap.channel),specularIntensityMapUv:Xt&&p(y.specularIntensityMap.channel),transmissionMapUv:Kt&&p(y.transmissionMap.channel),thicknessMapUv:le&&p(y.thicknessMap.channel),alphaMapUv:ot&&p(y.alphaMap.channel),vertexTangents:!!D.attributes.tangent&&(ft||Ht),vertexNormals:!!D.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!D.attributes.color&&D.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!D.attributes.uv&&(ae||ot),fog:!!W,useFog:y.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||D.attributes.normal===void 0&&ft===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Ct,skinning:N.isSkinnedMesh===!0,morphTargets:D.morphAttributes.position!==void 0,morphNormals:D.morphAttributes.normal!==void 0,morphColors:D.morphAttributes.color!==void 0,morphTargetsCount:At,morphTextureStride:$t,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:H.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:tt,decodeVideoTexture:ae&&y.map.isVideoTexture===!0&&se.getTransfer(y.map.colorSpace)===he,decodeVideoTextureEmissive:L&&y.emissiveMap.isVideoTexture===!0&&se.getTransfer(y.emissiveMap.colorSpace)===he,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===xe,flipSided:y.side===Xe,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:ht&&y.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ht&&y.extensions.multiDraw===!0||kt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return It.vertexUv1s=l.has(1),It.vertexUv2s=l.has(2),It.vertexUv3s=l.has(3),l.clear(),It}function g(y){const T=[];if(y.shaderID?T.push(y.shaderID):(T.push(y.customVertexShaderID),T.push(y.customFragmentShaderID)),y.defines!==void 0)for(const I in y.defines)T.push(I),T.push(y.defines[I]);return y.isRawShaderMaterial===!1&&(m(T,y),v(T,y),T.push(i.outputColorSpace)),T.push(y.customProgramCacheKey),T.join()}function m(y,T){y.push(T.precision),y.push(T.outputColorSpace),y.push(T.envMapMode),y.push(T.envMapCubeUVHeight),y.push(T.mapUv),y.push(T.alphaMapUv),y.push(T.lightMapUv),y.push(T.aoMapUv),y.push(T.bumpMapUv),y.push(T.normalMapUv),y.push(T.displacementMapUv),y.push(T.emissiveMapUv),y.push(T.metalnessMapUv),y.push(T.roughnessMapUv),y.push(T.anisotropyMapUv),y.push(T.clearcoatMapUv),y.push(T.clearcoatNormalMapUv),y.push(T.clearcoatRoughnessMapUv),y.push(T.iridescenceMapUv),y.push(T.iridescenceThicknessMapUv),y.push(T.sheenColorMapUv),y.push(T.sheenRoughnessMapUv),y.push(T.specularMapUv),y.push(T.specularColorMapUv),y.push(T.specularIntensityMapUv),y.push(T.transmissionMapUv),y.push(T.thicknessMapUv),y.push(T.combine),y.push(T.fogExp2),y.push(T.sizeAttenuation),y.push(T.morphTargetsCount),y.push(T.morphAttributeCount),y.push(T.numDirLights),y.push(T.numPointLights),y.push(T.numSpotLights),y.push(T.numSpotLightMaps),y.push(T.numHemiLights),y.push(T.numRectAreaLights),y.push(T.numDirLightShadows),y.push(T.numPointLightShadows),y.push(T.numSpotLightShadows),y.push(T.numSpotLightShadowsWithMaps),y.push(T.numLightProbes),y.push(T.shadowMapType),y.push(T.toneMapping),y.push(T.numClippingPlanes),y.push(T.numClipIntersection),y.push(T.depthPacking)}function v(y,T){a.disableAll(),T.instancing&&a.enable(0),T.instancingColor&&a.enable(1),T.instancingMorph&&a.enable(2),T.matcap&&a.enable(3),T.envMap&&a.enable(4),T.normalMapObjectSpace&&a.enable(5),T.normalMapTangentSpace&&a.enable(6),T.clearcoat&&a.enable(7),T.iridescence&&a.enable(8),T.alphaTest&&a.enable(9),T.vertexColors&&a.enable(10),T.vertexAlphas&&a.enable(11),T.vertexUv1s&&a.enable(12),T.vertexUv2s&&a.enable(13),T.vertexUv3s&&a.enable(14),T.vertexTangents&&a.enable(15),T.anisotropy&&a.enable(16),T.alphaHash&&a.enable(17),T.batching&&a.enable(18),T.dispersion&&a.enable(19),T.batchingColor&&a.enable(20),T.gradientMap&&a.enable(21),T.packedNormalMap&&a.enable(22),T.vertexNormals&&a.enable(23),y.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.reversedDepthBuffer&&a.enable(4),T.skinning&&a.enable(5),T.morphTargets&&a.enable(6),T.morphNormals&&a.enable(7),T.morphColors&&a.enable(8),T.premultipliedAlpha&&a.enable(9),T.shadowMapEnabled&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.transmission&&a.enable(15),T.sheen&&a.enable(16),T.opaque&&a.enable(17),T.pointsUvs&&a.enable(18),T.decodeVideoTexture&&a.enable(19),T.decodeVideoTextureEmissive&&a.enable(20),T.alphaToCoverage&&a.enable(21),T.numLightProbeGrids>0&&a.enable(22),y.push(a.mask)}function M(y){const T=f[y.type];let I;if(T){const C=wn[T];I=Ef.clone(C.uniforms)}else I=y.uniforms;return I}function S(y,T){let I=h.get(T);return I!==void 0?++I.usedTimes:(I=new tx(i,T,y,s),c.push(I),h.set(T,I)),I}function R(y){if(--y.usedTimes===0){const T=c.indexOf(y);c[T]=c[c.length-1],c.pop(),h.delete(y.cacheKey),y.destroy()}}function E(y){o.remove(y)}function P(){o.dispose()}return{getParameters:x,getProgramCacheKey:g,getUniforms:M,acquireProgram:S,releaseProgram:R,releaseShaderCache:E,programs:c,dispose:P}}function ax(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function ox(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Tc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Ac(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function o(d,f,p,x,g,m){let v=i[t];return v===void 0?(v={id:d.id,object:d,geometry:f,material:p,materialVariant:a(d),groupOrder:x,renderOrder:d.renderOrder,z:g,group:m},i[t]=v):(v.id=d.id,v.object=d,v.geometry=f,v.material=p,v.materialVariant=a(d),v.groupOrder=x,v.renderOrder=d.renderOrder,v.z=g,v.group=m),t++,v}function l(d,f,p,x,g,m){const v=o(d,f,p,x,g,m);p.transmission>0?n.push(v):p.transparent===!0?s.push(v):e.push(v)}function c(d,f,p,x,g,m){const v=o(d,f,p,x,g,m);p.transmission>0?n.unshift(v):p.transparent===!0?s.unshift(v):e.unshift(v)}function h(d,f){e.length>1&&e.sort(d||ox),n.length>1&&n.sort(f||Tc),s.length>1&&s.sort(f||Tc)}function u(){for(let d=t,f=i.length;d<f;d++){const p=i[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:u,sort:h}}function lx(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new Ac,i.set(n,[a])):s>=r.length?(a=new Ac,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function cx(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new A,color:new Nt};break;case"SpotLight":e={position:new A,direction:new A,color:new Nt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new A,color:new Nt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new A,skyColor:new Nt,groundColor:new Nt};break;case"RectAreaLight":e={color:new Nt,position:new A,halfWidth:new A,halfHeight:new A};break}return i[t.id]=e,e}}}function hx(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let ux=0;function dx(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function fx(i){const t=new cx,e=hx(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new A);const s=new A,r=new ee,a=new ee;function o(c){let h=0,u=0,d=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let f=0,p=0,x=0,g=0,m=0,v=0,M=0,S=0,R=0,E=0,P=0;c.sort(dx);for(let T=0,I=c.length;T<I;T++){const C=c[T],N=C.color,H=C.intensity,W=C.distance;let D=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===Ai?D=C.shadow.map.texture:D=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)h+=N.r*H,u+=N.g*H,d+=N.b*H;else if(C.isLightProbe){for(let B=0;B<9;B++)n.probe[B].addScaledVector(C.sh.coefficients[B],H);P++}else if(C.isDirectionalLight){const B=t.get(C);if(B.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const k=C.shadow,J=e.get(C);J.shadowIntensity=k.intensity,J.shadowBias=k.bias,J.shadowNormalBias=k.normalBias,J.shadowRadius=k.radius,J.shadowMapSize=k.mapSize,n.directionalShadow[f]=J,n.directionalShadowMap[f]=D,n.directionalShadowMatrix[f]=C.shadow.matrix,v++}n.directional[f]=B,f++}else if(C.isSpotLight){const B=t.get(C);B.position.setFromMatrixPosition(C.matrixWorld),B.color.copy(N).multiplyScalar(H),B.distance=W,B.coneCos=Math.cos(C.angle),B.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),B.decay=C.decay,n.spot[x]=B;const k=C.shadow;if(C.map&&(n.spotLightMap[R]=C.map,R++,k.updateMatrices(C),C.castShadow&&E++),n.spotLightMatrix[x]=k.matrix,C.castShadow){const J=e.get(C);J.shadowIntensity=k.intensity,J.shadowBias=k.bias,J.shadowNormalBias=k.normalBias,J.shadowRadius=k.radius,J.shadowMapSize=k.mapSize,n.spotShadow[x]=J,n.spotShadowMap[x]=D,S++}x++}else if(C.isRectAreaLight){const B=t.get(C);B.color.copy(N).multiplyScalar(H),B.halfWidth.set(C.width*.5,0,0),B.halfHeight.set(0,C.height*.5,0),n.rectArea[g]=B,g++}else if(C.isPointLight){const B=t.get(C);if(B.color.copy(C.color).multiplyScalar(C.intensity),B.distance=C.distance,B.decay=C.decay,C.castShadow){const k=C.shadow,J=e.get(C);J.shadowIntensity=k.intensity,J.shadowBias=k.bias,J.shadowNormalBias=k.normalBias,J.shadowRadius=k.radius,J.shadowMapSize=k.mapSize,J.shadowCameraNear=k.camera.near,J.shadowCameraFar=k.camera.far,n.pointShadow[p]=J,n.pointShadowMap[p]=D,n.pointShadowMatrix[p]=C.shadow.matrix,M++}n.point[p]=B,p++}else if(C.isHemisphereLight){const B=t.get(C);B.skyColor.copy(C.color).multiplyScalar(H),B.groundColor.copy(C.groundColor).multiplyScalar(H),n.hemi[m]=B,m++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=gt.LTC_FLOAT_1,n.rectAreaLTC2=gt.LTC_FLOAT_2):(n.rectAreaLTC1=gt.LTC_HALF_1,n.rectAreaLTC2=gt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const y=n.hash;(y.directionalLength!==f||y.pointLength!==p||y.spotLength!==x||y.rectAreaLength!==g||y.hemiLength!==m||y.numDirectionalShadows!==v||y.numPointShadows!==M||y.numSpotShadows!==S||y.numSpotMaps!==R||y.numLightProbes!==P)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=g,n.point.length=p,n.hemi.length=m,n.directionalShadow.length=v,n.directionalShadowMap.length=v,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=S,n.spotShadowMap.length=S,n.directionalShadowMatrix.length=v,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=S+R-E,n.spotLightMap.length=R,n.numSpotLightShadowsWithMaps=E,n.numLightProbes=P,y.directionalLength=f,y.pointLength=p,y.spotLength=x,y.rectAreaLength=g,y.hemiLength=m,y.numDirectionalShadows=v,y.numPointShadows=M,y.numSpotShadows=S,y.numSpotMaps=R,y.numLightProbes=P,n.version=ux++)}function l(c,h){let u=0,d=0,f=0,p=0,x=0;const g=h.matrixWorldInverse;for(let m=0,v=c.length;m<v;m++){const M=c[m];if(M.isDirectionalLight){const S=n.directional[u];S.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(s),S.direction.transformDirection(g),u++}else if(M.isSpotLight){const S=n.spot[f];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(g),S.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),S.direction.sub(s),S.direction.transformDirection(g),f++}else if(M.isRectAreaLight){const S=n.rectArea[p];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(g),a.identity(),r.copy(M.matrixWorld),r.premultiply(g),a.extractRotation(r),S.halfWidth.set(M.width*.5,0,0),S.halfHeight.set(0,M.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),p++}else if(M.isPointLight){const S=n.point[d];S.position.setFromMatrixPosition(M.matrixWorld),S.position.applyMatrix4(g),d++}else if(M.isHemisphereLight){const S=n.hemi[x];S.direction.setFromMatrixPosition(M.matrixWorld),S.direction.transformDirection(g),x++}}}return{setup:o,setupView:l,state:n}}function Cc(i){const t=new fx(i),e=[],n=[],s=[];function r(d){u.camera=d,e.length=0,n.length=0,s.length=0}function a(d){e.push(d)}function o(d){n.push(d)}function l(d){s.push(d)}function c(){t.setup(e)}function h(d){t.setupView(e,d)}const u={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function px(i){let t=new WeakMap;function e(s,r=0){const a=t.get(s);let o;return a===void 0?(o=new Cc(i),t.set(s,[o])):r>=a.length?(o=new Cc(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}const mx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,gx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,xx=[new A(1,0,0),new A(-1,0,0),new A(0,1,0),new A(0,-1,0),new A(0,0,1),new A(0,0,-1)],vx=[new A(0,-1,0),new A(0,-1,0),new A(0,0,1),new A(0,0,-1),new A(0,-1,0),new A(0,-1,0)],Rc=new ee,vs=new A,Aa=new A;function _x(i,t,e){let n=new Zo;const s=new ut,r=new ut,a=new Me,o=new Rf,l=new Pf,c={},h=e.maxTextureSize,u={[fi]:Xe,[Xe]:fi,[xe]:xe},d=new an({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ut},radius:{value:4}},vertexShader:mx,fragmentShader:gx}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const p=new _e;p.setAttribute("position",new Ze(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new Tt(p,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ws;let m=this.type;this.render=function(E,P,y){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||E.length===0)return;this.type===Su&&(Ot("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=ws);const T=i.getRenderTarget(),I=i.getActiveCubeFace(),C=i.getActiveMipmapLevel(),N=i.state;N.setBlending(Xn),N.buffers.depth.getReversed()===!0?N.buffers.color.setClear(0,0,0,0):N.buffers.color.setClear(1,1,1,1),N.buffers.depth.setTest(!0),N.setScissorTest(!1);const H=m!==this.type;H&&P.traverse(function(W){W.material&&(Array.isArray(W.material)?W.material.forEach(D=>D.needsUpdate=!0):W.material.needsUpdate=!0)});for(let W=0,D=E.length;W<D;W++){const B=E[W],k=B.shadow;if(k===void 0){Ot("WebGLShadowMap:",B,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;s.copy(k.mapSize);const J=k.getFrameExtents();s.multiply(J),r.copy(k.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/J.x),s.x=r.x*J.x,k.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/J.y),s.y=r.y*J.y,k.mapSize.y=r.y));const et=i.state.buffers.depth.getReversed();if(k.camera._reversedDepth=et,k.map===null||H===!0){if(k.map!==null&&(k.map.depthTexture!==null&&(k.map.depthTexture.dispose(),k.map.depthTexture=null),k.map.dispose()),this.type===Ms){if(B.isPointLight){Ot("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}k.map=new Cn(s.x,s.y,{format:Ai,type:Yn,minFilter:We,magFilter:We,generateMipmaps:!1}),k.map.texture.name=B.name+".shadowMap",k.map.depthTexture=new ss(s.x,s.y,gn),k.map.depthTexture.name=B.name+".shadowMapDepth",k.map.depthTexture.format=Zn,k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=Fe,k.map.depthTexture.magFilter=Fe}else B.isPointLight?(k.map=new Vh(s.x),k.map.depthTexture=new Wd(s.x,Ln)):(k.map=new Cn(s.x,s.y),k.map.depthTexture=new ss(s.x,s.y,Ln)),k.map.depthTexture.name=B.name+".shadowMap",k.map.depthTexture.format=Zn,this.type===ws?(k.map.depthTexture.compareFunction=et?Wo:Ho,k.map.depthTexture.minFilter=We,k.map.depthTexture.magFilter=We):(k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=Fe,k.map.depthTexture.magFilter=Fe);k.camera.updateProjectionMatrix()}const dt=k.map.isWebGLCubeRenderTarget?6:1;for(let yt=0;yt<dt;yt++){if(k.map.isWebGLCubeRenderTarget)i.setRenderTarget(k.map,yt),i.clear();else{yt===0&&(i.setRenderTarget(k.map),i.clear());const At=k.getViewport(yt);a.set(r.x*At.x,r.y*At.y,r.x*At.z,r.y*At.w),N.viewport(a)}if(B.isPointLight){const At=k.camera,$t=k.matrix,ie=B.distance||At.far;ie!==At.far&&(At.far=ie,At.updateProjectionMatrix()),vs.setFromMatrixPosition(B.matrixWorld),At.position.copy(vs),Aa.copy(At.position),Aa.add(xx[yt]),At.up.copy(vx[yt]),At.lookAt(Aa),At.updateMatrixWorld(),$t.makeTranslation(-vs.x,-vs.y,-vs.z),Rc.multiplyMatrices(At.projectionMatrix,At.matrixWorldInverse),k._frustum.setFromProjectionMatrix(Rc,At.coordinateSystem,At.reversedDepth)}else k.updateMatrices(B);n=k.getFrustum(),S(P,y,k.camera,B,this.type)}k.isPointLightShadow!==!0&&this.type===Ms&&v(k,y),k.needsUpdate=!1}m=this.type,g.needsUpdate=!1,i.setRenderTarget(T,I,C)};function v(E,P){const y=t.update(x);d.defines.VSM_SAMPLES!==E.blurSamples&&(d.defines.VSM_SAMPLES=E.blurSamples,f.defines.VSM_SAMPLES=E.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new Cn(s.x,s.y,{format:Ai,type:Yn})),d.uniforms.shadow_pass.value=E.map.depthTexture,d.uniforms.resolution.value=E.mapSize,d.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(P,null,y,d,x,null),f.uniforms.shadow_pass.value=E.mapPass.texture,f.uniforms.resolution.value=E.mapSize,f.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(P,null,y,f,x,null)}function M(E,P,y,T){let I=null;const C=y.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(C!==void 0)I=C;else if(I=y.isPointLight===!0?l:o,i.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const N=I.uuid,H=P.uuid;let W=c[N];W===void 0&&(W={},c[N]=W);let D=W[H];D===void 0&&(D=I.clone(),W[H]=D,P.addEventListener("dispose",R)),I=D}if(I.visible=P.visible,I.wireframe=P.wireframe,T===Ms?I.side=P.shadowSide!==null?P.shadowSide:P.side:I.side=P.shadowSide!==null?P.shadowSide:u[P.side],I.alphaMap=P.alphaMap,I.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,I.map=P.map,I.clipShadows=P.clipShadows,I.clippingPlanes=P.clippingPlanes,I.clipIntersection=P.clipIntersection,I.displacementMap=P.displacementMap,I.displacementScale=P.displacementScale,I.displacementBias=P.displacementBias,I.wireframeLinewidth=P.wireframeLinewidth,I.linewidth=P.linewidth,y.isPointLight===!0&&I.isMeshDistanceMaterial===!0){const N=i.properties.get(I);N.light=y}return I}function S(E,P,y,T,I){if(E.visible===!1)return;if(E.layers.test(P.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&I===Ms)&&(!E.frustumCulled||n.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,E.matrixWorld);const H=t.update(E),W=E.material;if(Array.isArray(W)){const D=H.groups;for(let B=0,k=D.length;B<k;B++){const J=D[B],et=W[J.materialIndex];if(et&&et.visible){const dt=M(E,et,T,I);E.onBeforeShadow(i,E,P,y,H,dt,J),i.renderBufferDirect(y,null,H,dt,E,J),E.onAfterShadow(i,E,P,y,H,dt,J)}}}else if(W.visible){const D=M(E,W,T,I);E.onBeforeShadow(i,E,P,y,H,D,null),i.renderBufferDirect(y,null,H,D,E,null),E.onAfterShadow(i,E,P,y,H,D,null)}}const N=E.children;for(let H=0,W=N.length;H<W;H++)S(N[H],P,y,T,I)}function R(E){E.target.removeEventListener("dispose",R);for(const y in c){const T=c[y],I=E.target.uuid;I in T&&(T[I].dispose(),delete T[I])}}}function yx(i,t){function e(){let U=!1;const ot=new Me;let $=null;const St=new Me(0,0,0,0);return{setMask:function(ht){$!==ht&&!U&&(i.colorMask(ht,ht,ht,ht),$=ht)},setLocked:function(ht){U=ht},setClear:function(ht,tt,It,Yt,Se){Se===!0&&(ht*=Yt,tt*=Yt,It*=Yt),ot.set(ht,tt,It,Yt),St.equals(ot)===!1&&(i.clearColor(ht,tt,It,Yt),St.copy(ot))},reset:function(){U=!1,$=null,St.set(-1,0,0,0)}}}function n(){let U=!1,ot=!1,$=null,St=null,ht=null;return{setReversed:function(tt){if(ot!==tt){const It=t.get("EXT_clip_control");tt?It.clipControlEXT(It.LOWER_LEFT_EXT,It.ZERO_TO_ONE_EXT):It.clipControlEXT(It.LOWER_LEFT_EXT,It.NEGATIVE_ONE_TO_ONE_EXT),ot=tt;const Yt=ht;ht=null,this.setClear(Yt)}},getReversed:function(){return ot},setTest:function(tt){tt?it(i.DEPTH_TEST):Ct(i.DEPTH_TEST)},setMask:function(tt){$!==tt&&!U&&(i.depthMask(tt),$=tt)},setFunc:function(tt){if(ot&&(tt=ed[tt]),St!==tt){switch(tt){case ka:i.depthFunc(i.NEVER);break;case Ba:i.depthFunc(i.ALWAYS);break;case za:i.depthFunc(i.LESS);break;case ns:i.depthFunc(i.LEQUAL);break;case Ga:i.depthFunc(i.EQUAL);break;case Va:i.depthFunc(i.GEQUAL);break;case Ha:i.depthFunc(i.GREATER);break;case Wa:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}St=tt}},setLocked:function(tt){U=tt},setClear:function(tt){ht!==tt&&(ht=tt,ot&&(tt=1-tt),i.clearDepth(tt))},reset:function(){U=!1,$=null,St=null,ht=null,ot=!1}}}function s(){let U=!1,ot=null,$=null,St=null,ht=null,tt=null,It=null,Yt=null,Se=null;return{setTest:function(ue){U||(ue?it(i.STENCIL_TEST):Ct(i.STENCIL_TEST))},setMask:function(ue){ot!==ue&&!U&&(i.stencilMask(ue),ot=ue)},setFunc:function(ue,Dn,_n){($!==ue||St!==Dn||ht!==_n)&&(i.stencilFunc(ue,Dn,_n),$=ue,St=Dn,ht=_n)},setOp:function(ue,Dn,_n){(tt!==ue||It!==Dn||Yt!==_n)&&(i.stencilOp(ue,Dn,_n),tt=ue,It=Dn,Yt=_n)},setLocked:function(ue){U=ue},setClear:function(ue){Se!==ue&&(i.clearStencil(ue),Se=ue)},reset:function(){U=!1,ot=null,$=null,St=null,ht=null,tt=null,It=null,Yt=null,Se=null}}}const r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap;let h={},u={},d={},f=new WeakMap,p=[],x=null,g=!1,m=null,v=null,M=null,S=null,R=null,E=null,P=null,y=new Nt(0,0,0),T=0,I=!1,C=null,N=null,H=null,W=null,D=null;const B=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let k=!1,J=0;const et=i.getParameter(i.VERSION);et.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(et)[1]),k=J>=1):et.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(et)[1]),k=J>=2);let dt=null,yt={};const At=i.getParameter(i.SCISSOR_BOX),$t=i.getParameter(i.VIEWPORT),ie=new Me().fromArray(At),Bt=new Me().fromArray($t);function Y(U,ot,$,St){const ht=new Uint8Array(4),tt=i.createTexture();i.bindTexture(U,tt),i.texParameteri(U,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(U,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let It=0;It<$;It++)U===i.TEXTURE_3D||U===i.TEXTURE_2D_ARRAY?i.texImage3D(ot,0,i.RGBA,1,1,St,0,i.RGBA,i.UNSIGNED_BYTE,ht):i.texImage2D(ot+It,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ht);return tt}const pt={};pt[i.TEXTURE_2D]=Y(i.TEXTURE_2D,i.TEXTURE_2D,1),pt[i.TEXTURE_CUBE_MAP]=Y(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),pt[i.TEXTURE_2D_ARRAY]=Y(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),pt[i.TEXTURE_3D]=Y(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),it(i.DEPTH_TEST),a.setFunc(ns),vt(!1),ft(gl),it(i.CULL_FACE),nt(Xn);function it(U){h[U]!==!0&&(i.enable(U),h[U]=!0)}function Ct(U){h[U]!==!1&&(i.disable(U),h[U]=!1)}function Ft(U,ot){return d[U]!==ot?(i.bindFramebuffer(U,ot),d[U]=ot,U===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=ot),U===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=ot),!0):!1}function kt(U,ot){let $=p,St=!1;if(U){$=f.get(ot),$===void 0&&($=[],f.set(ot,$));const ht=U.textures;if($.length!==ht.length||$[0]!==i.COLOR_ATTACHMENT0){for(let tt=0,It=ht.length;tt<It;tt++)$[tt]=i.COLOR_ATTACHMENT0+tt;$.length=ht.length,St=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,St=!0);St&&i.drawBuffers($)}function ae(U){return x!==U?(i.useProgram(U),x=U,!0):!1}const Gt={[yi]:i.FUNC_ADD,[wu]:i.FUNC_SUBTRACT,[Eu]:i.FUNC_REVERSE_SUBTRACT};Gt[Tu]=i.MIN,Gt[Au]=i.MAX;const K={[Cu]:i.ZERO,[Ru]:i.ONE,[Pu]:i.SRC_COLOR,[Fa]:i.SRC_ALPHA,[Fu]:i.SRC_ALPHA_SATURATE,[Uu]:i.DST_COLOR,[Iu]:i.DST_ALPHA,[Lu]:i.ONE_MINUS_SRC_COLOR,[Oa]:i.ONE_MINUS_SRC_ALPHA,[Nu]:i.ONE_MINUS_DST_COLOR,[Du]:i.ONE_MINUS_DST_ALPHA,[Ou]:i.CONSTANT_COLOR,[ku]:i.ONE_MINUS_CONSTANT_COLOR,[Bu]:i.CONSTANT_ALPHA,[zu]:i.ONE_MINUS_CONSTANT_ALPHA};function nt(U,ot,$,St,ht,tt,It,Yt,Se,ue){if(U===Xn){g===!0&&(Ct(i.BLEND),g=!1);return}if(g===!1&&(it(i.BLEND),g=!0),U!==bu){if(U!==m||ue!==I){if((v!==yi||R!==yi)&&(i.blendEquation(i.FUNC_ADD),v=yi,R=yi),ue)switch(U){case ji:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case wi:i.blendFunc(i.ONE,i.ONE);break;case xl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case vl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:re("WebGLState: Invalid blending: ",U);break}else switch(U){case ji:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case wi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case xl:re("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case vl:re("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:re("WebGLState: Invalid blending: ",U);break}M=null,S=null,E=null,P=null,y.set(0,0,0),T=0,m=U,I=ue}return}ht=ht||ot,tt=tt||$,It=It||St,(ot!==v||ht!==R)&&(i.blendEquationSeparate(Gt[ot],Gt[ht]),v=ot,R=ht),($!==M||St!==S||tt!==E||It!==P)&&(i.blendFuncSeparate(K[$],K[St],K[tt],K[It]),M=$,S=St,E=tt,P=It),(Yt.equals(y)===!1||Se!==T)&&(i.blendColor(Yt.r,Yt.g,Yt.b,Se),y.copy(Yt),T=Se),m=U,I=!1}function j(U,ot){U.side===xe?Ct(i.CULL_FACE):it(i.CULL_FACE);let $=U.side===Xe;ot&&($=!$),vt($),U.blending===ji&&U.transparent===!1?nt(Xn):nt(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),a.setFunc(U.depthFunc),a.setTest(U.depthTest),a.setMask(U.depthWrite),r.setMask(U.colorWrite);const St=U.stencilWrite;o.setTest(St),St&&(o.setMask(U.stencilWriteMask),o.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),o.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),L(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?it(i.SAMPLE_ALPHA_TO_COVERAGE):Ct(i.SAMPLE_ALPHA_TO_COVERAGE)}function vt(U){C!==U&&(U?i.frontFace(i.CW):i.frontFace(i.CCW),C=U)}function ft(U){U!==yu?(it(i.CULL_FACE),U!==N&&(U===gl?i.cullFace(i.BACK):U===Mu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ct(i.CULL_FACE),N=U}function Vt(U){U!==H&&(k&&i.lineWidth(U),H=U)}function L(U,ot,$){U?(it(i.POLYGON_OFFSET_FILL),(W!==ot||D!==$)&&(W=ot,D=$,a.getReversed()&&(ot=-ot),i.polygonOffset(ot,$))):Ct(i.POLYGON_OFFSET_FILL)}function Wt(U){U?it(i.SCISSOR_TEST):Ct(i.SCISSOR_TEST)}function Rt(U){U===void 0&&(U=i.TEXTURE0+B-1),dt!==U&&(i.activeTexture(U),dt=U)}function Ht(U,ot,$){$===void 0&&(dt===null?$=i.TEXTURE0+B-1:$=dt);let St=yt[$];St===void 0&&(St={type:void 0,texture:void 0},yt[$]=St),(St.type!==U||St.texture!==ot)&&(dt!==$&&(i.activeTexture($),dt=$),i.bindTexture(U,ot||pt[U]),St.type=U,St.texture=ot)}function st(){const U=yt[dt];U!==void 0&&U.type!==void 0&&(i.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function ce(){try{i.compressedTexImage2D(...arguments)}catch(U){re("WebGLState:",U)}}function w(){try{i.compressedTexImage3D(...arguments)}catch(U){re("WebGLState:",U)}}function _(){try{i.texSubImage2D(...arguments)}catch(U){re("WebGLState:",U)}}function O(){try{i.texSubImage3D(...arguments)}catch(U){re("WebGLState:",U)}}function q(){try{i.compressedTexSubImage2D(...arguments)}catch(U){re("WebGLState:",U)}}function Q(){try{i.compressedTexSubImage3D(...arguments)}catch(U){re("WebGLState:",U)}}function rt(){try{i.texStorage2D(...arguments)}catch(U){re("WebGLState:",U)}}function lt(){try{i.texStorage3D(...arguments)}catch(U){re("WebGLState:",U)}}function X(){try{i.texImage2D(...arguments)}catch(U){re("WebGLState:",U)}}function Z(){try{i.texImage3D(...arguments)}catch(U){re("WebGLState:",U)}}function Mt(U){return u[U]!==void 0?u[U]:i.getParameter(U)}function wt(U,ot){u[U]!==ot&&(i.pixelStorei(U,ot),u[U]=ot)}function ct(U){ie.equals(U)===!1&&(i.scissor(U.x,U.y,U.z,U.w),ie.copy(U))}function at(U){Bt.equals(U)===!1&&(i.viewport(U.x,U.y,U.z,U.w),Bt.copy(U))}function Xt(U,ot){let $=c.get(ot);$===void 0&&($=new WeakMap,c.set(ot,$));let St=$.get(U);St===void 0&&(St=i.getUniformBlockIndex(ot,U.name),$.set(U,St))}function Kt(U,ot){const St=c.get(ot).get(U);l.get(ot)!==St&&(i.uniformBlockBinding(ot,St,U.__bindingPointIndex),l.set(ot,St))}function le(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},u={},dt=null,yt={},d={},f=new WeakMap,p=[],x=null,g=!1,m=null,v=null,M=null,S=null,R=null,E=null,P=null,y=new Nt(0,0,0),T=0,I=!1,C=null,N=null,H=null,W=null,D=null,ie.set(0,0,i.canvas.width,i.canvas.height),Bt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:it,disable:Ct,bindFramebuffer:Ft,drawBuffers:kt,useProgram:ae,setBlending:nt,setMaterial:j,setFlipSided:vt,setCullFace:ft,setLineWidth:Vt,setPolygonOffset:L,setScissorTest:Wt,activeTexture:Rt,bindTexture:Ht,unbindTexture:st,compressedTexImage2D:ce,compressedTexImage3D:w,texImage2D:X,texImage3D:Z,pixelStorei:wt,getParameter:Mt,updateUBOMapping:Xt,uniformBlockBinding:Kt,texStorage2D:rt,texStorage3D:lt,texSubImage2D:_,texSubImage3D:O,compressedTexSubImage2D:q,compressedTexSubImage3D:Q,scissor:ct,viewport:at,reset:le}}function Mx(i,t,e,n,s,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ut,h=new WeakMap,u=new Set;let d;const f=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(w,_){return p?new OffscreenCanvas(w,_):Ur("canvas")}function g(w,_,O){let q=1;const Q=ce(w);if((Q.width>O||Q.height>O)&&(q=O/Math.max(Q.width,Q.height)),q<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){const rt=Math.floor(q*Q.width),lt=Math.floor(q*Q.height);d===void 0&&(d=x(rt,lt));const X=_?x(rt,lt):d;return X.width=rt,X.height=lt,X.getContext("2d").drawImage(w,0,0,rt,lt),Ot("WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+rt+"x"+lt+")."),X}else return"data"in w&&Ot("WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),w;return w}function m(w){return w.generateMipmaps}function v(w){i.generateMipmap(w)}function M(w){return w.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?i.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function S(w,_,O,q,Q,rt=!1){if(w!==null){if(i[w]!==void 0)return i[w];Ot("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let lt;q&&(lt=t.get("EXT_texture_norm16"),lt||Ot("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let X=_;if(_===i.RED&&(O===i.FLOAT&&(X=i.R32F),O===i.HALF_FLOAT&&(X=i.R16F),O===i.UNSIGNED_BYTE&&(X=i.R8),O===i.UNSIGNED_SHORT&&lt&&(X=lt.R16_EXT),O===i.SHORT&&lt&&(X=lt.R16_SNORM_EXT)),_===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.R8UI),O===i.UNSIGNED_SHORT&&(X=i.R16UI),O===i.UNSIGNED_INT&&(X=i.R32UI),O===i.BYTE&&(X=i.R8I),O===i.SHORT&&(X=i.R16I),O===i.INT&&(X=i.R32I)),_===i.RG&&(O===i.FLOAT&&(X=i.RG32F),O===i.HALF_FLOAT&&(X=i.RG16F),O===i.UNSIGNED_BYTE&&(X=i.RG8),O===i.UNSIGNED_SHORT&&lt&&(X=lt.RG16_EXT),O===i.SHORT&&lt&&(X=lt.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.RG8UI),O===i.UNSIGNED_SHORT&&(X=i.RG16UI),O===i.UNSIGNED_INT&&(X=i.RG32UI),O===i.BYTE&&(X=i.RG8I),O===i.SHORT&&(X=i.RG16I),O===i.INT&&(X=i.RG32I)),_===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.RGB8UI),O===i.UNSIGNED_SHORT&&(X=i.RGB16UI),O===i.UNSIGNED_INT&&(X=i.RGB32UI),O===i.BYTE&&(X=i.RGB8I),O===i.SHORT&&(X=i.RGB16I),O===i.INT&&(X=i.RGB32I)),_===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),O===i.UNSIGNED_INT&&(X=i.RGBA32UI),O===i.BYTE&&(X=i.RGBA8I),O===i.SHORT&&(X=i.RGBA16I),O===i.INT&&(X=i.RGBA32I)),_===i.RGB&&(O===i.UNSIGNED_SHORT&&lt&&(X=lt.RGB16_EXT),O===i.SHORT&&lt&&(X=lt.RGB16_SNORM_EXT),O===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(X=i.R11F_G11F_B10F)),_===i.RGBA){const Z=rt?Dr:se.getTransfer(Q);O===i.FLOAT&&(X=i.RGBA32F),O===i.HALF_FLOAT&&(X=i.RGBA16F),O===i.UNSIGNED_BYTE&&(X=Z===he?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT&&lt&&(X=lt.RGBA16_EXT),O===i.SHORT&&lt&&(X=lt.RGBA16_SNORM_EXT),O===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&t.get("EXT_color_buffer_float"),X}function R(w,_){let O;return w?_===null||_===Ln||_===Ls?O=i.DEPTH24_STENCIL8:_===gn?O=i.DEPTH32F_STENCIL8:_===Ps&&(O=i.DEPTH24_STENCIL8,Ot("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Ln||_===Ls?O=i.DEPTH_COMPONENT24:_===gn?O=i.DEPTH_COMPONENT32F:_===Ps&&(O=i.DEPTH_COMPONENT16),O}function E(w,_){return m(w)===!0||w.isFramebufferTexture&&w.minFilter!==Fe&&w.minFilter!==We?Math.log2(Math.max(_.width,_.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?_.mipmaps.length:1}function P(w){const _=w.target;_.removeEventListener("dispose",P),T(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&u.delete(_)}function y(w){const _=w.target;_.removeEventListener("dispose",y),C(_)}function T(w){const _=n.get(w);if(_.__webglInit===void 0)return;const O=w.source,q=f.get(O);if(q){const Q=q[_.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&I(w),Object.keys(q).length===0&&f.delete(O)}n.remove(w)}function I(w){const _=n.get(w);i.deleteTexture(_.__webglTexture);const O=w.source,q=f.get(O);delete q[_.__cacheKey],a.memory.textures--}function C(w){const _=n.get(w);if(w.depthTexture&&(w.depthTexture.dispose(),n.remove(w.depthTexture)),w.isWebGLCubeRenderTarget)for(let q=0;q<6;q++){if(Array.isArray(_.__webglFramebuffer[q]))for(let Q=0;Q<_.__webglFramebuffer[q].length;Q++)i.deleteFramebuffer(_.__webglFramebuffer[q][Q]);else i.deleteFramebuffer(_.__webglFramebuffer[q]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[q])}else{if(Array.isArray(_.__webglFramebuffer))for(let q=0;q<_.__webglFramebuffer.length;q++)i.deleteFramebuffer(_.__webglFramebuffer[q]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let q=0;q<_.__webglColorRenderbuffer.length;q++)_.__webglColorRenderbuffer[q]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[q]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const O=w.textures;for(let q=0,Q=O.length;q<Q;q++){const rt=n.get(O[q]);rt.__webglTexture&&(i.deleteTexture(rt.__webglTexture),a.memory.textures--),n.remove(O[q])}n.remove(w)}let N=0;function H(){N=0}function W(){return N}function D(w){N=w}function B(){const w=N;return w>=s.maxTextures&&Ot("WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+s.maxTextures),N+=1,w}function k(w){const _=[];return _.push(w.wrapS),_.push(w.wrapT),_.push(w.wrapR||0),_.push(w.magFilter),_.push(w.minFilter),_.push(w.anisotropy),_.push(w.internalFormat),_.push(w.format),_.push(w.type),_.push(w.generateMipmaps),_.push(w.premultiplyAlpha),_.push(w.flipY),_.push(w.unpackAlignment),_.push(w.colorSpace),_.join()}function J(w,_){const O=n.get(w);if(w.isVideoTexture&&Ht(w),w.isRenderTargetTexture===!1&&w.isExternalTexture!==!0&&w.version>0&&O.__version!==w.version){const q=w.image;if(q===null)Ot("WebGLRenderer: Texture marked for update but no image data found.");else if(q.complete===!1)Ot("WebGLRenderer: Texture marked for update but image is incomplete");else{Ct(O,w,_);return}}else w.isExternalTexture&&(O.__webglTexture=w.sourceTexture?w.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+_)}function et(w,_){const O=n.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&O.__version!==w.version){Ct(O,w,_);return}else w.isExternalTexture&&(O.__webglTexture=w.sourceTexture?w.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+_)}function dt(w,_){const O=n.get(w);if(w.isRenderTargetTexture===!1&&w.version>0&&O.__version!==w.version){Ct(O,w,_);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+_)}function yt(w,_){const O=n.get(w);if(w.isCubeDepthTexture!==!0&&w.version>0&&O.__version!==w.version){Ft(O,w,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+_)}const At={[Ti]:i.REPEAT,[Hn]:i.CLAMP_TO_EDGE,[Xa]:i.MIRRORED_REPEAT},$t={[Fe]:i.NEAREST,[Hu]:i.NEAREST_MIPMAP_NEAREST,[Xs]:i.NEAREST_MIPMAP_LINEAR,[We]:i.LINEAR,[Yr]:i.LINEAR_MIPMAP_NEAREST,[Si]:i.LINEAR_MIPMAP_LINEAR},ie={[$u]:i.NEVER,[Ju]:i.ALWAYS,[qu]:i.LESS,[Ho]:i.LEQUAL,[Yu]:i.EQUAL,[Wo]:i.GEQUAL,[Zu]:i.GREATER,[Ku]:i.NOTEQUAL};function Bt(w,_){if(_.type===gn&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===We||_.magFilter===Yr||_.magFilter===Xs||_.magFilter===Si||_.minFilter===We||_.minFilter===Yr||_.minFilter===Xs||_.minFilter===Si)&&Ot("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(w,i.TEXTURE_WRAP_S,At[_.wrapS]),i.texParameteri(w,i.TEXTURE_WRAP_T,At[_.wrapT]),(w===i.TEXTURE_3D||w===i.TEXTURE_2D_ARRAY)&&i.texParameteri(w,i.TEXTURE_WRAP_R,At[_.wrapR]),i.texParameteri(w,i.TEXTURE_MAG_FILTER,$t[_.magFilter]),i.texParameteri(w,i.TEXTURE_MIN_FILTER,$t[_.minFilter]),_.compareFunction&&(i.texParameteri(w,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(w,i.TEXTURE_COMPARE_FUNC,ie[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Fe||_.minFilter!==Xs&&_.minFilter!==Si||_.type===gn&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(w,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Y(w,_){let O=!1;w.__webglInit===void 0&&(w.__webglInit=!0,_.addEventListener("dispose",P));const q=_.source;let Q=f.get(q);Q===void 0&&(Q={},f.set(q,Q));const rt=k(_);if(rt!==w.__cacheKey){Q[rt]===void 0&&(Q[rt]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,O=!0),Q[rt].usedTimes++;const lt=Q[w.__cacheKey];lt!==void 0&&(Q[w.__cacheKey].usedTimes--,lt.usedTimes===0&&I(_)),w.__cacheKey=rt,w.__webglTexture=Q[rt].texture}return O}function pt(w,_,O){return Math.floor(Math.floor(w/O)/_)}function it(w,_,O,q){const rt=w.updateRanges;if(rt.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,O,q,_.data);else{rt.sort((wt,ct)=>wt.start-ct.start);let lt=0;for(let wt=1;wt<rt.length;wt++){const ct=rt[lt],at=rt[wt],Xt=ct.start+ct.count,Kt=pt(at.start,_.width,4),le=pt(ct.start,_.width,4);at.start<=Xt+1&&Kt===le&&pt(at.start+at.count-1,_.width,4)===Kt?ct.count=Math.max(ct.count,at.start+at.count-ct.start):(++lt,rt[lt]=at)}rt.length=lt+1;const X=e.getParameter(i.UNPACK_ROW_LENGTH),Z=e.getParameter(i.UNPACK_SKIP_PIXELS),Mt=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let wt=0,ct=rt.length;wt<ct;wt++){const at=rt[wt],Xt=Math.floor(at.start/4),Kt=Math.ceil(at.count/4),le=Xt%_.width,U=Math.floor(Xt/_.width),ot=Kt,$=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,le),e.pixelStorei(i.UNPACK_SKIP_ROWS,U),e.texSubImage2D(i.TEXTURE_2D,0,le,U,ot,$,O,q,_.data)}w.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,X),e.pixelStorei(i.UNPACK_SKIP_PIXELS,Z),e.pixelStorei(i.UNPACK_SKIP_ROWS,Mt)}}function Ct(w,_,O){let q=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(q=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(q=i.TEXTURE_3D);const Q=Y(w,_),rt=_.source;e.bindTexture(q,w.__webglTexture,i.TEXTURE0+O);const lt=n.get(rt);if(rt.version!==lt.__version||Q===!0){if(e.activeTexture(i.TEXTURE0+O),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){const $=se.getPrimaries(se.workingColorSpace),St=_.colorSpace===hi?null:se.getPrimaries(_.colorSpace),ht=_.colorSpace===hi||$===St?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ht)}e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let Z=g(_.image,!1,s.maxTextureSize);Z=st(_,Z);const Mt=r.convert(_.format,_.colorSpace),wt=r.convert(_.type);let ct=S(_.internalFormat,Mt,wt,_.normalized,_.colorSpace,_.isVideoTexture);Bt(q,_);let at;const Xt=_.mipmaps,Kt=_.isVideoTexture!==!0,le=lt.__version===void 0||Q===!0,U=rt.dataReady,ot=E(_,Z);if(_.isDepthTexture)ct=R(_.format===bi,_.type),le&&(Kt?e.texStorage2D(i.TEXTURE_2D,1,ct,Z.width,Z.height):e.texImage2D(i.TEXTURE_2D,0,ct,Z.width,Z.height,0,Mt,wt,null));else if(_.isDataTexture)if(Xt.length>0){Kt&&le&&e.texStorage2D(i.TEXTURE_2D,ot,ct,Xt[0].width,Xt[0].height);for(let $=0,St=Xt.length;$<St;$++)at=Xt[$],Kt?U&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,at.width,at.height,Mt,wt,at.data):e.texImage2D(i.TEXTURE_2D,$,ct,at.width,at.height,0,Mt,wt,at.data);_.generateMipmaps=!1}else Kt?(le&&e.texStorage2D(i.TEXTURE_2D,ot,ct,Z.width,Z.height),U&&it(_,Z,Mt,wt)):e.texImage2D(i.TEXTURE_2D,0,ct,Z.width,Z.height,0,Mt,wt,Z.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Kt&&le&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ot,ct,Xt[0].width,Xt[0].height,Z.depth);for(let $=0,St=Xt.length;$<St;$++)if(at=Xt[$],_.format!==xn)if(Mt!==null)if(Kt){if(U)if(_.layerUpdates.size>0){const ht=ac(at.width,at.height,_.format,_.type);for(const tt of _.layerUpdates){const It=at.data.subarray(tt*ht/at.data.BYTES_PER_ELEMENT,(tt+1)*ht/at.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,tt,at.width,at.height,1,Mt,It)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,at.width,at.height,Z.depth,Mt,at.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,$,ct,at.width,at.height,Z.depth,0,at.data,0,0);else Ot("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Kt?U&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,at.width,at.height,Z.depth,Mt,wt,at.data):e.texImage3D(i.TEXTURE_2D_ARRAY,$,ct,at.width,at.height,Z.depth,0,Mt,wt,at.data)}else{Kt&&le&&e.texStorage2D(i.TEXTURE_2D,ot,ct,Xt[0].width,Xt[0].height);for(let $=0,St=Xt.length;$<St;$++)at=Xt[$],_.format!==xn?Mt!==null?Kt?U&&e.compressedTexSubImage2D(i.TEXTURE_2D,$,0,0,at.width,at.height,Mt,at.data):e.compressedTexImage2D(i.TEXTURE_2D,$,ct,at.width,at.height,0,at.data):Ot("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Kt?U&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,at.width,at.height,Mt,wt,at.data):e.texImage2D(i.TEXTURE_2D,$,ct,at.width,at.height,0,Mt,wt,at.data)}else if(_.isDataArrayTexture)if(Kt){if(le&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ot,ct,Z.width,Z.height,Z.depth),U)if(_.layerUpdates.size>0){const $=ac(Z.width,Z.height,_.format,_.type);for(const St of _.layerUpdates){const ht=Z.data.subarray(St*$/Z.data.BYTES_PER_ELEMENT,(St+1)*$/Z.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,St,Z.width,Z.height,1,Mt,wt,ht)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Z.width,Z.height,Z.depth,Mt,wt,Z.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,ct,Z.width,Z.height,Z.depth,0,Mt,wt,Z.data);else if(_.isData3DTexture)Kt?(le&&e.texStorage3D(i.TEXTURE_3D,ot,ct,Z.width,Z.height,Z.depth),U&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Z.width,Z.height,Z.depth,Mt,wt,Z.data)):e.texImage3D(i.TEXTURE_3D,0,ct,Z.width,Z.height,Z.depth,0,Mt,wt,Z.data);else if(_.isFramebufferTexture){if(le)if(Kt)e.texStorage2D(i.TEXTURE_2D,ot,ct,Z.width,Z.height);else{let $=Z.width,St=Z.height;for(let ht=0;ht<ot;ht++)e.texImage2D(i.TEXTURE_2D,ht,ct,$,St,0,Mt,wt,null),$>>=1,St>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){const $=i.canvas;if($.hasAttribute("layoutsubtree")||$.setAttribute("layoutsubtree","true"),Z.parentNode!==$){$.appendChild(Z),u.add(_),$.onpaint=Yt=>{const Se=Yt.changedElements;for(const ue of u)Se.includes(ue.image)&&(ue.needsUpdate=!0)},$.requestPaint();return}const St=0,ht=i.RGBA,tt=i.RGBA,It=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,St,ht,tt,It,Z),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Xt.length>0){if(Kt&&le){const $=ce(Xt[0]);e.texStorage2D(i.TEXTURE_2D,ot,ct,$.width,$.height)}for(let $=0,St=Xt.length;$<St;$++)at=Xt[$],Kt?U&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,Mt,wt,at):e.texImage2D(i.TEXTURE_2D,$,ct,Mt,wt,at);_.generateMipmaps=!1}else if(Kt){if(le){const $=ce(Z);e.texStorage2D(i.TEXTURE_2D,ot,ct,$.width,$.height)}U&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,Mt,wt,Z)}else e.texImage2D(i.TEXTURE_2D,0,ct,Mt,wt,Z);m(_)&&v(q),lt.__version=rt.version,_.onUpdate&&_.onUpdate(_)}w.__version=_.version}function Ft(w,_,O){if(_.image.length!==6)return;const q=Y(w,_),Q=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,w.__webglTexture,i.TEXTURE0+O);const rt=n.get(Q);if(Q.version!==rt.__version||q===!0){e.activeTexture(i.TEXTURE0+O);const lt=se.getPrimaries(se.workingColorSpace),X=_.colorSpace===hi?null:se.getPrimaries(_.colorSpace),Z=_.colorSpace===hi||lt===X?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Z);const Mt=_.isCompressedTexture||_.image[0].isCompressedTexture,wt=_.image[0]&&_.image[0].isDataTexture,ct=[];for(let tt=0;tt<6;tt++)!Mt&&!wt?ct[tt]=g(_.image[tt],!0,s.maxCubemapSize):ct[tt]=wt?_.image[tt].image:_.image[tt],ct[tt]=st(_,ct[tt]);const at=ct[0],Xt=r.convert(_.format,_.colorSpace),Kt=r.convert(_.type),le=S(_.internalFormat,Xt,Kt,_.normalized,_.colorSpace),U=_.isVideoTexture!==!0,ot=rt.__version===void 0||q===!0,$=Q.dataReady;let St=E(_,at);Bt(i.TEXTURE_CUBE_MAP,_);let ht;if(Mt){U&&ot&&e.texStorage2D(i.TEXTURE_CUBE_MAP,St,le,at.width,at.height);for(let tt=0;tt<6;tt++){ht=ct[tt].mipmaps;for(let It=0;It<ht.length;It++){const Yt=ht[It];_.format!==xn?Xt!==null?U?$&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It,0,0,Yt.width,Yt.height,Xt,Yt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It,le,Yt.width,Yt.height,0,Yt.data):Ot("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):U?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It,0,0,Yt.width,Yt.height,Xt,Kt,Yt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It,le,Yt.width,Yt.height,0,Xt,Kt,Yt.data)}}}else{if(ht=_.mipmaps,U&&ot){ht.length>0&&St++;const tt=ce(ct[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,St,le,tt.width,tt.height)}for(let tt=0;tt<6;tt++)if(wt){U?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,ct[tt].width,ct[tt].height,Xt,Kt,ct[tt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,le,ct[tt].width,ct[tt].height,0,Xt,Kt,ct[tt].data);for(let It=0;It<ht.length;It++){const Se=ht[It].image[tt].image;U?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It+1,0,0,Se.width,Se.height,Xt,Kt,Se.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It+1,le,Se.width,Se.height,0,Xt,Kt,Se.data)}}else{U?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,0,0,Xt,Kt,ct[tt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0,le,Xt,Kt,ct[tt]);for(let It=0;It<ht.length;It++){const Yt=ht[It];U?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It+1,0,0,Xt,Kt,Yt.image[tt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+tt,It+1,le,Xt,Kt,Yt.image[tt])}}}m(_)&&v(i.TEXTURE_CUBE_MAP),rt.__version=Q.version,_.onUpdate&&_.onUpdate(_)}w.__version=_.version}function kt(w,_,O,q,Q,rt){const lt=r.convert(O.format,O.colorSpace),X=r.convert(O.type),Z=S(O.internalFormat,lt,X,O.normalized,O.colorSpace),Mt=n.get(_),wt=n.get(O);if(wt.__renderTarget=_,!Mt.__hasExternalTextures){const ct=Math.max(1,_.width>>rt),at=Math.max(1,_.height>>rt);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?e.texImage3D(Q,rt,Z,ct,at,_.depth,0,lt,X,null):e.texImage2D(Q,rt,Z,ct,at,0,lt,X,null)}e.bindFramebuffer(i.FRAMEBUFFER,w),Rt(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,q,Q,wt.__webglTexture,0,Wt(_)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,q,Q,wt.__webglTexture,rt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ae(w,_,O){if(i.bindRenderbuffer(i.RENDERBUFFER,w),_.depthBuffer){const q=_.depthTexture,Q=q&&q.isDepthTexture?q.type:null,rt=R(_.stencilBuffer,Q),lt=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;Rt(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Wt(_),rt,_.width,_.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,Wt(_),rt,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,rt,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,lt,i.RENDERBUFFER,w)}else{const q=_.textures;for(let Q=0;Q<q.length;Q++){const rt=q[Q],lt=r.convert(rt.format,rt.colorSpace),X=r.convert(rt.type),Z=S(rt.internalFormat,lt,X,rt.normalized,rt.colorSpace);Rt(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Wt(_),Z,_.width,_.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,Wt(_),Z,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,Z,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Gt(w,_,O){const q=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,w),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Q=n.get(_.depthTexture);if(Q.__renderTarget=_,(!Q.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),q){if(Q.__webglInit===void 0&&(Q.__webglInit=!0,_.depthTexture.addEventListener("dispose",P)),Q.__webglTexture===void 0){Q.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,Q.__webglTexture),Bt(i.TEXTURE_CUBE_MAP,_.depthTexture);const Mt=r.convert(_.depthTexture.format),wt=r.convert(_.depthTexture.type);let ct;_.depthTexture.format===Zn?ct=i.DEPTH_COMPONENT24:_.depthTexture.format===bi&&(ct=i.DEPTH24_STENCIL8);for(let at=0;at<6;at++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,ct,_.width,_.height,0,Mt,wt,null)}}else J(_.depthTexture,0);const rt=Q.__webglTexture,lt=Wt(_),X=q?i.TEXTURE_CUBE_MAP_POSITIVE_X+O:i.TEXTURE_2D,Z=_.depthTexture.format===bi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===Zn)Rt(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,X,rt,0,lt):i.framebufferTexture2D(i.FRAMEBUFFER,Z,X,rt,0);else if(_.depthTexture.format===bi)Rt(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Z,X,rt,0,lt):i.framebufferTexture2D(i.FRAMEBUFFER,Z,X,rt,0);else throw new Error("Unknown depthTexture format")}function K(w){const _=n.get(w),O=w.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==w.depthTexture){const q=w.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),q){const Q=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,q.removeEventListener("dispose",Q)};q.addEventListener("dispose",Q),_.__depthDisposeCallback=Q}_.__boundDepthTexture=q}if(w.depthTexture&&!_.__autoAllocateDepthBuffer)if(O)for(let q=0;q<6;q++)Gt(_.__webglFramebuffer[q],w,q);else{const q=w.texture.mipmaps;q&&q.length>0?Gt(_.__webglFramebuffer[0],w,0):Gt(_.__webglFramebuffer,w,0)}else if(O){_.__webglDepthbuffer=[];for(let q=0;q<6;q++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[q]),_.__webglDepthbuffer[q]===void 0)_.__webglDepthbuffer[q]=i.createRenderbuffer(),ae(_.__webglDepthbuffer[q],w,!1);else{const Q=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,rt=_.__webglDepthbuffer[q];i.bindRenderbuffer(i.RENDERBUFFER,rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,rt)}}else{const q=w.texture.mipmaps;if(q&&q.length>0?e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),ae(_.__webglDepthbuffer,w,!1);else{const Q=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,rt=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,rt)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function nt(w,_,O){const q=n.get(w);_!==void 0&&kt(q.__webglFramebuffer,w,w.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&K(w)}function j(w){const _=w.texture,O=n.get(w),q=n.get(_);w.addEventListener("dispose",y);const Q=w.textures,rt=w.isWebGLCubeRenderTarget===!0,lt=Q.length>1;if(lt||(q.__webglTexture===void 0&&(q.__webglTexture=i.createTexture()),q.__version=_.version,a.memory.textures++),rt){O.__webglFramebuffer=[];for(let X=0;X<6;X++)if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer[X]=[];for(let Z=0;Z<_.mipmaps.length;Z++)O.__webglFramebuffer[X][Z]=i.createFramebuffer()}else O.__webglFramebuffer[X]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer=[];for(let X=0;X<_.mipmaps.length;X++)O.__webglFramebuffer[X]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(lt)for(let X=0,Z=Q.length;X<Z;X++){const Mt=n.get(Q[X]);Mt.__webglTexture===void 0&&(Mt.__webglTexture=i.createTexture(),a.memory.textures++)}if(w.samples>0&&Rt(w)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let X=0;X<Q.length;X++){const Z=Q[X];O.__webglColorRenderbuffer[X]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[X]);const Mt=r.convert(Z.format,Z.colorSpace),wt=r.convert(Z.type),ct=S(Z.internalFormat,Mt,wt,Z.normalized,Z.colorSpace,w.isXRRenderTarget===!0),at=Wt(w);i.renderbufferStorageMultisample(i.RENDERBUFFER,at,ct,w.width,w.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+X,i.RENDERBUFFER,O.__webglColorRenderbuffer[X])}i.bindRenderbuffer(i.RENDERBUFFER,null),w.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),ae(O.__webglDepthRenderbuffer,w,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(rt){e.bindTexture(i.TEXTURE_CUBE_MAP,q.__webglTexture),Bt(i.TEXTURE_CUBE_MAP,_);for(let X=0;X<6;X++)if(_.mipmaps&&_.mipmaps.length>0)for(let Z=0;Z<_.mipmaps.length;Z++)kt(O.__webglFramebuffer[X][Z],w,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+X,Z);else kt(O.__webglFramebuffer[X],w,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+X,0);m(_)&&v(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(lt){for(let X=0,Z=Q.length;X<Z;X++){const Mt=Q[X],wt=n.get(Mt);let ct=i.TEXTURE_2D;(w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(ct=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ct,wt.__webglTexture),Bt(ct,Mt),kt(O.__webglFramebuffer,w,Mt,i.COLOR_ATTACHMENT0+X,ct,0),m(Mt)&&v(ct)}e.unbindTexture()}else{let X=i.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(X=w.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(X,q.__webglTexture),Bt(X,_),_.mipmaps&&_.mipmaps.length>0)for(let Z=0;Z<_.mipmaps.length;Z++)kt(O.__webglFramebuffer[Z],w,_,i.COLOR_ATTACHMENT0,X,Z);else kt(O.__webglFramebuffer,w,_,i.COLOR_ATTACHMENT0,X,0);m(_)&&v(X),e.unbindTexture()}w.depthBuffer&&K(w)}function vt(w){const _=w.textures;for(let O=0,q=_.length;O<q;O++){const Q=_[O];if(m(Q)){const rt=M(w),lt=n.get(Q).__webglTexture;e.bindTexture(rt,lt),v(rt),e.unbindTexture()}}}const ft=[],Vt=[];function L(w){if(w.samples>0){if(Rt(w)===!1){const _=w.textures,O=w.width,q=w.height;let Q=i.COLOR_BUFFER_BIT;const rt=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,lt=n.get(w),X=_.length>1;if(X)for(let Mt=0;Mt<_.length;Mt++)e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,lt.__webglMultisampledFramebuffer);const Z=w.texture.mipmaps;Z&&Z.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,lt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,lt.__webglFramebuffer);for(let Mt=0;Mt<_.length;Mt++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),X){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,lt.__webglColorRenderbuffer[Mt]);const wt=n.get(_[Mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,wt,0)}i.blitFramebuffer(0,0,O,q,0,0,O,q,Q,i.NEAREST),l===!0&&(ft.length=0,Vt.length=0,ft.push(i.COLOR_ATTACHMENT0+Mt),w.depthBuffer&&w.resolveDepthBuffer===!1&&(ft.push(rt),Vt.push(rt),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Vt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ft))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),X)for(let Mt=0;Mt<_.length;Mt++){e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,lt.__webglColorRenderbuffer[Mt]);const wt=n.get(_[Mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,lt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,wt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,lt.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.resolveDepthBuffer===!1&&l){const _=w.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function Wt(w){return Math.min(s.maxSamples,w.samples)}function Rt(w){const _=n.get(w);return w.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function Ht(w){const _=a.render.frame;h.get(w)!==_&&(h.set(w,_),w.update())}function st(w,_){const O=w.colorSpace,q=w.format,Q=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||O!==Ir&&O!==hi&&(se.getTransfer(O)===he?(q!==xn||Q!==sn)&&Ot("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):re("WebGLTextures: Unsupported texture color space:",O)),_}function ce(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(c.width=w.naturalWidth||w.width,c.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(c.width=w.displayWidth,c.height=w.displayHeight):(c.width=w.width,c.height=w.height),c}this.allocateTextureUnit=B,this.resetTextureUnits=H,this.getTextureUnits=W,this.setTextureUnits=D,this.setTexture2D=J,this.setTexture2DArray=et,this.setTexture3D=dt,this.setTextureCube=yt,this.rebindTextures=nt,this.setupRenderTarget=j,this.updateRenderTargetMipmap=vt,this.updateMultisampleRenderTarget=L,this.setupDepthRenderbuffer=K,this.setupFrameBufferTexture=kt,this.useMultisampledRTT=Rt,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Sx(i,t){function e(n,s=hi){let r;const a=se.getTransfer(s);if(n===sn)return i.UNSIGNED_BYTE;if(n===Oo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===ko)return i.UNSIGNED_SHORT_5_5_5_1;if(n===uh)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===dh)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===ch)return i.BYTE;if(n===hh)return i.SHORT;if(n===Ps)return i.UNSIGNED_SHORT;if(n===Fo)return i.INT;if(n===Ln)return i.UNSIGNED_INT;if(n===gn)return i.FLOAT;if(n===Yn)return i.HALF_FLOAT;if(n===fh)return i.ALPHA;if(n===ph)return i.RGB;if(n===xn)return i.RGBA;if(n===Zn)return i.DEPTH_COMPONENT;if(n===bi)return i.DEPTH_STENCIL;if(n===Bo)return i.RED;if(n===zo)return i.RED_INTEGER;if(n===Ai)return i.RG;if(n===Go)return i.RG_INTEGER;if(n===Vo)return i.RGBA_INTEGER;if(n===Sr||n===br||n===wr||n===Er)if(a===he)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Sr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===wr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Er)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Sr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===br)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===wr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Er)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===$a||n===qa||n===Ya||n===Za)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===$a)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===qa)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ya)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Za)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ka||n===Ja||n===ja||n===Qa||n===to||n===Pr||n===eo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ka||n===Ja)return a===he?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ja)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Qa)return r.COMPRESSED_R11_EAC;if(n===to)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Pr)return r.COMPRESSED_RG11_EAC;if(n===eo)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===no||n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho||n===uo||n===fo||n===po||n===mo||n===go)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===no)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===io)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===so)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ro)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ao)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===oo)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===lo)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===co)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ho)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===uo)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===fo)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===po)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===mo)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===go)return a===he?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===xo||n===vo||n===_o)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===xo)return a===he?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===vo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===_o)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===yo||n===Mo||n===Lr||n===So)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===yo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Mo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Lr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===So)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ls?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const bx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,wx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Ex{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new Th(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new an({vertexShader:bx,fragmentShader:wx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Tt(new Ae(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Tx extends Ri{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,p=null;const x=typeof XRWebGLBinding<"u",g=new Ex,m={},v=e.getContextAttributes();let M=null,S=null;const R=[],E=[],P=new ut;let y=null;const T=new nn;T.viewport=new Me;const I=new nn;I.viewport=new Me;const C=[T,I],N=new Ff;let H=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let pt=R[Y];return pt===void 0&&(pt=new ta,R[Y]=pt),pt.getTargetRaySpace()},this.getControllerGrip=function(Y){let pt=R[Y];return pt===void 0&&(pt=new ta,R[Y]=pt),pt.getGripSpace()},this.getHand=function(Y){let pt=R[Y];return pt===void 0&&(pt=new ta,R[Y]=pt),pt.getHandSpace()};function D(Y){const pt=E.indexOf(Y.inputSource);if(pt===-1)return;const it=R[pt];it!==void 0&&(it.update(Y.inputSource,Y.frame,c||a),it.dispatchEvent({type:Y.type,data:Y.inputSource}))}function B(){s.removeEventListener("select",D),s.removeEventListener("selectstart",D),s.removeEventListener("selectend",D),s.removeEventListener("squeeze",D),s.removeEventListener("squeezestart",D),s.removeEventListener("squeezeend",D),s.removeEventListener("end",B),s.removeEventListener("inputsourceschange",k);for(let Y=0;Y<R.length;Y++){const pt=E[Y];pt!==null&&(E[Y]=null,R[Y].disconnect(pt))}H=null,W=null,g.reset();for(const Y in m)delete m[Y];t.setRenderTarget(M),f=null,d=null,u=null,s=null,S=null,Bt.stop(),n.isPresenting=!1,t.setPixelRatio(y),t.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){r=Y,n.isPresenting===!0&&Ot("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===!0&&Ot("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Y){c=Y},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u===null&&x&&(u=new XRWebGLBinding(s,e)),u},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(Y){if(s=Y,s!==null){if(M=t.getRenderTarget(),s.addEventListener("select",D),s.addEventListener("selectstart",D),s.addEventListener("selectend",D),s.addEventListener("squeeze",D),s.addEventListener("squeezestart",D),s.addEventListener("squeezeend",D),s.addEventListener("end",B),s.addEventListener("inputsourceschange",k),v.xrCompatible!==!0&&await e.makeXRCompatible(),y=t.getPixelRatio(),t.getSize(P),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let it=null,Ct=null,Ft=null;v.depth&&(Ft=v.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,it=v.stencil?bi:Zn,Ct=v.stencil?Ls:Ln);const kt={colorFormat:e.RGBA8,depthFormat:Ft,scaleFactor:r};u=this.getBinding(),d=u.createProjectionLayer(kt),s.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),S=new Cn(d.textureWidth,d.textureHeight,{format:xn,type:sn,depthTexture:new ss(d.textureWidth,d.textureHeight,Ct,void 0,void 0,void 0,void 0,void 0,void 0,it),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const it={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,it),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),S=new Cn(f.framebufferWidth,f.framebufferHeight,{format:xn,type:sn,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Bt.setContext(s),Bt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function k(Y){for(let pt=0;pt<Y.removed.length;pt++){const it=Y.removed[pt],Ct=E.indexOf(it);Ct>=0&&(E[Ct]=null,R[Ct].disconnect(it))}for(let pt=0;pt<Y.added.length;pt++){const it=Y.added[pt];let Ct=E.indexOf(it);if(Ct===-1){for(let kt=0;kt<R.length;kt++)if(kt>=E.length){E.push(it),Ct=kt;break}else if(E[kt]===null){E[kt]=it,Ct=kt;break}if(Ct===-1)break}const Ft=R[Ct];Ft&&Ft.connect(it)}}const J=new A,et=new A;function dt(Y,pt,it){J.setFromMatrixPosition(pt.matrixWorld),et.setFromMatrixPosition(it.matrixWorld);const Ct=J.distanceTo(et),Ft=pt.projectionMatrix.elements,kt=it.projectionMatrix.elements,ae=Ft[14]/(Ft[10]-1),Gt=Ft[14]/(Ft[10]+1),K=(Ft[9]+1)/Ft[5],nt=(Ft[9]-1)/Ft[5],j=(Ft[8]-1)/Ft[0],vt=(kt[8]+1)/kt[0],ft=ae*j,Vt=ae*vt,L=Ct/(-j+vt),Wt=L*-j;if(pt.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(Wt),Y.translateZ(L),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Ft[10]===-1)Y.projectionMatrix.copy(pt.projectionMatrix),Y.projectionMatrixInverse.copy(pt.projectionMatrixInverse);else{const Rt=ae+L,Ht=Gt+L,st=ft-Wt,ce=Vt+(Ct-Wt),w=K*Gt/Ht*Rt,_=nt*Gt/Ht*Rt;Y.projectionMatrix.makePerspective(st,ce,w,_,Rt,Ht),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function yt(Y,pt){pt===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(pt.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(s===null)return;let pt=Y.near,it=Y.far;g.texture!==null&&(g.depthNear>0&&(pt=g.depthNear),g.depthFar>0&&(it=g.depthFar)),N.near=I.near=T.near=pt,N.far=I.far=T.far=it,(H!==N.near||W!==N.far)&&(s.updateRenderState({depthNear:N.near,depthFar:N.far}),H=N.near,W=N.far),N.layers.mask=Y.layers.mask|6,T.layers.mask=N.layers.mask&-5,I.layers.mask=N.layers.mask&-3;const Ct=Y.parent,Ft=N.cameras;yt(N,Ct);for(let kt=0;kt<Ft.length;kt++)yt(Ft[kt],Ct);Ft.length===2?dt(N,T,I):N.projectionMatrix.copy(T.projectionMatrix),At(Y,N,Ct)};function At(Y,pt,it){it===null?Y.matrix.copy(pt.matrixWorld):(Y.matrix.copy(it.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(pt.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(pt.projectionMatrix),Y.projectionMatrixInverse.copy(pt.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=Ds*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return N},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(Y){l=Y,d!==null&&(d.fixedFoveation=Y),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Y)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(N)},this.getCameraTexture=function(Y){return m[Y]};let $t=null;function ie(Y,pt){if(h=pt.getViewerPose(c||a),p=pt,h!==null){const it=h.views;f!==null&&(t.setRenderTargetFramebuffer(S,f.framebuffer),t.setRenderTarget(S));let Ct=!1;it.length!==N.cameras.length&&(N.cameras.length=0,Ct=!0);for(let Gt=0;Gt<it.length;Gt++){const K=it[Gt];let nt=null;if(f!==null)nt=f.getViewport(K);else{const vt=u.getViewSubImage(d,K);nt=vt.viewport,Gt===0&&(t.setRenderTargetTextures(S,vt.colorTexture,vt.depthStencilTexture),t.setRenderTarget(S))}let j=C[Gt];j===void 0&&(j=new nn,j.layers.enable(Gt),j.viewport=new Me,C[Gt]=j),j.matrix.fromArray(K.transform.matrix),j.matrix.decompose(j.position,j.quaternion,j.scale),j.projectionMatrix.fromArray(K.projectionMatrix),j.projectionMatrixInverse.copy(j.projectionMatrix).invert(),j.viewport.set(nt.x,nt.y,nt.width,nt.height),Gt===0&&(N.matrix.copy(j.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),Ct===!0&&N.cameras.push(j)}const Ft=s.enabledFeatures;if(Ft&&Ft.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){u=n.getBinding();const Gt=u.getDepthInformation(it[0]);Gt&&Gt.isValid&&Gt.texture&&g.init(Gt,s.renderState)}if(Ft&&Ft.includes("camera-access")&&x){t.state.unbindTexture(),u=n.getBinding();for(let Gt=0;Gt<it.length;Gt++){const K=it[Gt].camera;if(K){let nt=m[K];nt||(nt=new Th,m[K]=nt);const j=u.getCameraImage(K);nt.sourceTexture=j}}}}for(let it=0;it<R.length;it++){const Ct=E[it],Ft=R[it];Ct!==null&&Ft!==void 0&&Ft.update(Ct,pt,c||a)}$t&&$t(Y,pt),pt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:pt}),p=null}const Bt=new zh;Bt.setAnimationLoop(ie),this.setAnimationLoop=function(Y){$t=Y},this.dispose=function(){}}}const Ax=new ee,qh=new qt;qh.set(-1,0,0,0,1,0,0,0,1);function Cx(i,t){function e(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function n(g,m){m.color.getRGB(g.fogColor.value,Fh(i)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function s(g,m,v,M,S){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(g,m):m.isMeshLambertMaterial?(r(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(g,m),u(g,m)):m.isMeshPhongMaterial?(r(g,m),h(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(g,m),d(g,m),m.isMeshPhysicalMaterial&&f(g,m,S)):m.isMeshMatcapMaterial?(r(g,m),p(g,m)):m.isMeshDepthMaterial?r(g,m):m.isMeshDistanceMaterial?(r(g,m),x(g,m)):m.isMeshNormalMaterial?r(g,m):m.isLineBasicMaterial?(a(g,m),m.isLineDashedMaterial&&o(g,m)):m.isPointsMaterial?l(g,m,v,M):m.isSpriteMaterial?c(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,e(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===Xe&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,e(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===Xe&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,e(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,e(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);const v=t.get(m),M=v.envMap,S=v.envMapRotation;M&&(g.envMap.value=M,g.envMapRotation.value.setFromMatrix4(Ax.makeRotationFromEuler(S)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(qh),g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,g.aoMapTransform))}function a(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform))}function o(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function l(g,m,v,M){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*v,g.scale.value=M*.5,m.map&&(g.map.value=m.map,e(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function c(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,e(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,e(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function h(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function u(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function d(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function f(g,m,v){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Xe&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=v.texture,g.transmissionSamplerSize.value.set(v.width,v.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function x(g,m){const v=t.get(m).light;g.referencePosition.value.setFromMatrixPosition(v.matrixWorld),g.nearDistance.value=v.shadow.camera.near,g.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Rx(i,t,e,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,M){const S=M.program;n.uniformBlockBinding(v,S)}function c(v,M){let S=s[v.id];S===void 0&&(p(v),S=h(v),s[v.id]=S,v.addEventListener("dispose",g));const R=M.program;n.updateUBOMapping(v,R);const E=t.render.frame;r[v.id]!==E&&(d(v),r[v.id]=E)}function h(v){const M=u();v.__bindingPointIndex=M;const S=i.createBuffer(),R=v.__size,E=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,S),i.bufferData(i.UNIFORM_BUFFER,R,E),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,S),S}function u(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return re("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(v){const M=s[v.id],S=v.uniforms,R=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let E=0,P=S.length;E<P;E++){const y=Array.isArray(S[E])?S[E]:[S[E]];for(let T=0,I=y.length;T<I;T++){const C=y[T];if(f(C,E,T,R)===!0){const N=C.__offset,H=Array.isArray(C.value)?C.value:[C.value];let W=0;for(let D=0;D<H.length;D++){const B=H[D],k=x(B);typeof B=="number"||typeof B=="boolean"?(C.__data[0]=B,i.bufferSubData(i.UNIFORM_BUFFER,N+W,C.__data)):B.isMatrix3?(C.__data[0]=B.elements[0],C.__data[1]=B.elements[1],C.__data[2]=B.elements[2],C.__data[3]=0,C.__data[4]=B.elements[3],C.__data[5]=B.elements[4],C.__data[6]=B.elements[5],C.__data[7]=0,C.__data[8]=B.elements[6],C.__data[9]=B.elements[7],C.__data[10]=B.elements[8],C.__data[11]=0):ArrayBuffer.isView(B)?C.__data.set(new B.constructor(B.buffer,B.byteOffset,C.__data.length)):(B.toArray(C.__data,W),W+=k.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,N,C.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(v,M,S,R){const E=v.value,P=M+"_"+S;if(R[P]===void 0)return typeof E=="number"||typeof E=="boolean"?R[P]=E:ArrayBuffer.isView(E)?R[P]=E.slice():R[P]=E.clone(),!0;{const y=R[P];if(typeof E=="number"||typeof E=="boolean"){if(y!==E)return R[P]=E,!0}else{if(ArrayBuffer.isView(E))return!0;if(y.equals(E)===!1)return y.copy(E),!0}}return!1}function p(v){const M=v.uniforms;let S=0;const R=16;for(let P=0,y=M.length;P<y;P++){const T=Array.isArray(M[P])?M[P]:[M[P]];for(let I=0,C=T.length;I<C;I++){const N=T[I],H=Array.isArray(N.value)?N.value:[N.value];for(let W=0,D=H.length;W<D;W++){const B=H[W],k=x(B),J=S%R,et=J%k.boundary,dt=J+et;S+=et,dt!==0&&R-dt<k.storage&&(S+=R-dt),N.__data=new Float32Array(k.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=S,S+=k.storage}}}const E=S%R;return E>0&&(S+=R-E),v.__size=S,v.__cache={},this}function x(v){const M={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(M.boundary=4,M.storage=4):v.isVector2?(M.boundary=8,M.storage=8):v.isVector3||v.isColor?(M.boundary=16,M.storage=12):v.isVector4?(M.boundary=16,M.storage=16):v.isMatrix3?(M.boundary=48,M.storage=48):v.isMatrix4?(M.boundary=64,M.storage=64):v.isTexture?Ot("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(M.boundary=16,M.storage=v.byteLength):Ot("WebGLRenderer: Unsupported uniform value type.",v),M}function g(v){const M=v.target;M.removeEventListener("dispose",g);const S=a.indexOf(M.__bindingPointIndex);a.splice(S,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function m(){for(const v in s)i.deleteBuffer(s[v]);a=[],s={},r={}}return{bind:l,update:c,dispose:m}}const Px=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Sn=null;function Lx(){return Sn===null&&(Sn=new Sh(Px,16,16,Ai,Yn),Sn.name="DFG_LUT",Sn.minFilter=We,Sn.magFilter=We,Sn.wrapS=Hn,Sn.wrapT=Hn,Sn.generateMipmaps=!1,Sn.needsUpdate=!0),Sn}class Ix{constructor(t={}){const{canvas:e=Qu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=sn}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;const x=f,g=new Set([Vo,Go,zo]),m=new Set([sn,Ln,Ps,Ls,Oo,ko]),v=new Uint32Array(4),M=new Int32Array(4),S=new A;let R=null,E=null;const P=[],y=[];let T=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=An,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const I=this;let C=!1,N=null;this._outputColorSpace=Re;let H=0,W=0,D=null,B=-1,k=null;const J=new Me,et=new Me;let dt=null;const yt=new Nt(0);let At=0,$t=e.width,ie=e.height,Bt=1,Y=null,pt=null;const it=new Me(0,0,$t,ie),Ct=new Me(0,0,$t,ie);let Ft=!1;const kt=new Zo;let ae=!1,Gt=!1;const K=new ee,nt=new A,j=new Me,vt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ft=!1;function Vt(){return D===null?Bt:1}let L=n;function Wt(b,F){return e.getContext(b,F)}try{const b={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Uo}`),e.addEventListener("webglcontextlost",tt,!1),e.addEventListener("webglcontextrestored",It,!1),e.addEventListener("webglcontextcreationerror",Yt,!1),L===null){const F="webgl2";if(L=Wt(F,b),L===null)throw Wt(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(b){throw re("WebGLRenderer: "+b.message),b}let Rt,Ht,st,ce,w,_,O,q,Q,rt,lt,X,Z,Mt,wt,ct,at,Xt,Kt,le,U,ot,$;function St(){Rt=new L0(L),Rt.init(),U=new Sx(L,Rt),Ht=new b0(L,Rt,t,U),st=new yx(L,Rt),Ht.reversedDepthBuffer&&d&&st.buffers.depth.setReversed(!0),ce=new U0(L),w=new ax,_=new Mx(L,Rt,st,w,Ht,U,ce),O=new P0(I),q=new kf(L),ot=new M0(L,q),Q=new I0(L,q,ce,ot),rt=new F0(L,Q,q,ot,ce),Xt=new N0(L,Ht,_),wt=new w0(w),lt=new rx(I,O,Rt,Ht,ot,wt),X=new Cx(I,w),Z=new lx,Mt=new px(Rt),at=new y0(I,O,st,rt,p,l),ct=new _x(I,rt,Ht),$=new Rx(L,ce,Ht,st),Kt=new S0(L,Rt,ce),le=new D0(L,Rt,ce),ce.programs=lt.programs,I.capabilities=Ht,I.extensions=Rt,I.properties=w,I.renderLists=Z,I.shadowMap=ct,I.state=st,I.info=ce}St(),x!==sn&&(T=new k0(x,e.width,e.height,s,r));const ht=new Tx(I,L);this.xr=ht,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const b=Rt.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){const b=Rt.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return Bt},this.setPixelRatio=function(b){b!==void 0&&(Bt=b,this.setSize($t,ie,!1))},this.getSize=function(b){return b.set($t,ie)},this.setSize=function(b,F,V=!0){if(ht.isPresenting){Ot("WebGLRenderer: Can't change size while VR device is presenting.");return}$t=b,ie=F,e.width=Math.floor(b*Bt),e.height=Math.floor(F*Bt),V===!0&&(e.style.width=b+"px",e.style.height=F+"px"),T!==null&&T.setSize(e.width,e.height),this.setViewport(0,0,b,F)},this.getDrawingBufferSize=function(b){return b.set($t*Bt,ie*Bt).floor()},this.setDrawingBufferSize=function(b,F,V){$t=b,ie=F,Bt=V,e.width=Math.floor(b*V),e.height=Math.floor(F*V),this.setViewport(0,0,b,F)},this.setEffects=function(b){if(x===sn){re("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let F=0;F<b.length;F++)if(b[F].isOutputPass===!0){Ot("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(J)},this.getViewport=function(b){return b.copy(it)},this.setViewport=function(b,F,V,z){b.isVector4?it.set(b.x,b.y,b.z,b.w):it.set(b,F,V,z),st.viewport(J.copy(it).multiplyScalar(Bt).round())},this.getScissor=function(b){return b.copy(Ct)},this.setScissor=function(b,F,V,z){b.isVector4?Ct.set(b.x,b.y,b.z,b.w):Ct.set(b,F,V,z),st.scissor(et.copy(Ct).multiplyScalar(Bt).round())},this.getScissorTest=function(){return Ft},this.setScissorTest=function(b){st.setScissorTest(Ft=b)},this.setOpaqueSort=function(b){Y=b},this.setTransparentSort=function(b){pt=b},this.getClearColor=function(b){return b.copy(at.getClearColor())},this.setClearColor=function(){at.setClearColor(...arguments)},this.getClearAlpha=function(){return at.getClearAlpha()},this.setClearAlpha=function(){at.setClearAlpha(...arguments)},this.clear=function(b=!0,F=!0,V=!0){let z=0;if(b){let G=!1;if(D!==null){const _t=D.texture.format;G=g.has(_t)}if(G){const _t=D.texture.type,Et=m.has(_t),xt=at.getClearColor(),Pt=at.getClearAlpha(),Dt=xt.r,Zt=xt.g,jt=xt.b;Et?(v[0]=Dt,v[1]=Zt,v[2]=jt,v[3]=Pt,L.clearBufferuiv(L.COLOR,0,v)):(M[0]=Dt,M[1]=Zt,M[2]=jt,M[3]=Pt,L.clearBufferiv(L.COLOR,0,M))}else z|=L.COLOR_BUFFER_BIT}F&&(z|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),V&&(z|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z!==0&&L.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),N=b},this.dispose=function(){e.removeEventListener("webglcontextlost",tt,!1),e.removeEventListener("webglcontextrestored",It,!1),e.removeEventListener("webglcontextcreationerror",Yt,!1),at.dispose(),Z.dispose(),Mt.dispose(),w.dispose(),O.dispose(),rt.dispose(),ot.dispose(),$.dispose(),lt.dispose(),ht.dispose(),ht.removeEventListener("sessionstart",ll),ht.removeEventListener("sessionend",cl),pi.stop()};function tt(b){b.preventDefault(),bl("WebGLRenderer: Context Lost."),C=!0}function It(){bl("WebGLRenderer: Context Restored."),C=!1;const b=ce.autoReset,F=ct.enabled,V=ct.autoUpdate,z=ct.needsUpdate,G=ct.type;St(),ce.autoReset=b,ct.enabled=F,ct.autoUpdate=V,ct.needsUpdate=z,ct.type=G}function Yt(b){re("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Se(b){const F=b.target;F.removeEventListener("dispose",Se),ue(F)}function ue(b){Dn(b),w.remove(b)}function Dn(b){const F=w.get(b).programs;F!==void 0&&(F.forEach(function(V){lt.releaseProgram(V)}),b.isShaderMaterial&&lt.releaseShaderCache(b))}this.renderBufferDirect=function(b,F,V,z,G,_t){F===null&&(F=vt);const Et=G.isMesh&&G.matrixWorld.determinant()<0,xt=pu(b,F,V,z,G);st.setMaterial(z,Et);let Pt=V.index,Dt=1;if(z.wireframe===!0){if(Pt=Q.getWireframeAttribute(V),Pt===void 0)return;Dt=2}const Zt=V.drawRange,jt=V.attributes.position;let Ut=Zt.start*Dt,de=(Zt.start+Zt.count)*Dt;_t!==null&&(Ut=Math.max(Ut,_t.start*Dt),de=Math.min(de,(_t.start+_t.count)*Dt)),Pt!==null?(Ut=Math.max(Ut,0),de=Math.min(de,Pt.count)):jt!=null&&(Ut=Math.max(Ut,0),de=Math.min(de,jt.count));const be=de-Ut;if(be<0||be===1/0)return;ot.setup(G,z,xt,V,Pt);let ye,fe=Kt;if(Pt!==null&&(ye=q.get(Pt),fe=le,fe.setIndex(ye)),G.isMesh)z.wireframe===!0?(st.setLineWidth(z.wireframeLinewidth*Vt()),fe.setMode(L.LINES)):fe.setMode(L.TRIANGLES);else if(G.isLine){let Be=z.linewidth;Be===void 0&&(Be=1),st.setLineWidth(Be*Vt()),G.isLineSegments?fe.setMode(L.LINES):G.isLineLoop?fe.setMode(L.LINE_LOOP):fe.setMode(L.LINE_STRIP)}else G.isPoints?fe.setMode(L.POINTS):G.isSprite&&fe.setMode(L.TRIANGLES);if(G.isBatchedMesh)if(Rt.get("WEBGL_multi_draw"))fe.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{const Be=G._multiDrawStarts,bt=G._multiDrawCounts,Qe=G._multiDrawCount,oe=Pt?q.get(Pt).bytesPerElement:1,on=w.get(z).currentProgram.getUniforms();for(let yn=0;yn<Qe;yn++)on.setValue(L,"_gl_DrawID",yn),fe.render(Be[yn]/oe,bt[yn])}else if(G.isInstancedMesh)fe.renderInstances(Ut,be,G.count);else if(V.isInstancedBufferGeometry){const Be=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,bt=Math.min(V.instanceCount,Be);fe.renderInstances(Ut,be,bt)}else fe.render(Ut,be)};function _n(b,F,V){b.transparent===!0&&b.side===xe&&b.forceSinglePass===!1?(b.side=Xe,b.needsUpdate=!0,Ws(b,F,V),b.side=fi,b.needsUpdate=!0,Ws(b,F,V),b.side=xe):Ws(b,F,V)}this.compile=function(b,F,V=null){V===null&&(V=b),E=Mt.get(V),E.init(F),y.push(E),V.traverseVisible(function(G){G.isLight&&G.layers.test(F.layers)&&(E.pushLight(G),G.castShadow&&E.pushShadow(G))}),b!==V&&b.traverseVisible(function(G){G.isLight&&G.layers.test(F.layers)&&(E.pushLight(G),G.castShadow&&E.pushShadow(G))}),E.setupLights();const z=new Set;return b.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;const _t=G.material;if(_t)if(Array.isArray(_t))for(let Et=0;Et<_t.length;Et++){const xt=_t[Et];_n(xt,V,G),z.add(xt)}else _n(_t,V,G),z.add(_t)}),E=y.pop(),z},this.compileAsync=function(b,F,V=null){const z=this.compile(b,F,V);return new Promise(G=>{function _t(){if(z.forEach(function(Et){w.get(Et).currentProgram.isReady()&&z.delete(Et)}),z.size===0){G(b);return}setTimeout(_t,10)}Rt.get("KHR_parallel_shader_compile")!==null?_t():setTimeout(_t,10)})};let Wr=null;function du(b){Wr&&Wr(b)}function ll(){pi.stop()}function cl(){pi.start()}const pi=new zh;pi.setAnimationLoop(du),typeof self<"u"&&pi.setContext(self),this.setAnimationLoop=function(b){Wr=b,ht.setAnimationLoop(b),b===null?pi.stop():pi.start()},ht.addEventListener("sessionstart",ll),ht.addEventListener("sessionend",cl),this.render=function(b,F){if(F!==void 0&&F.isCamera!==!0){re("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;N!==null&&N.renderStart(b,F);const V=ht.enabled===!0&&ht.isPresenting===!0,z=T!==null&&(D===null||V)&&T.begin(I,D);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),ht.enabled===!0&&ht.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(ht.cameraAutoUpdate===!0&&ht.updateCamera(F),F=ht.getCamera()),b.isScene===!0&&b.onBeforeRender(I,b,F,D),E=Mt.get(b,y.length),E.init(F),E.state.textureUnits=_.getTextureUnits(),y.push(E),K.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),kt.setFromProjectionMatrix(K,En,F.reversedDepth),Gt=this.localClippingEnabled,ae=wt.init(this.clippingPlanes,Gt),R=Z.get(b,P.length),R.init(),P.push(R),ht.enabled===!0&&ht.isPresenting===!0){const Et=I.xr.getDepthSensingMesh();Et!==null&&Xr(Et,F,-1/0,I.sortObjects)}Xr(b,F,0,I.sortObjects),R.finish(),I.sortObjects===!0&&R.sort(Y,pt),ft=ht.enabled===!1||ht.isPresenting===!1||ht.hasDepthSensing()===!1,ft&&at.addToRenderList(R,b),this.info.render.frame++,ae===!0&&wt.beginShadows();const G=E.state.shadowsArray;if(ct.render(G,b,F),ae===!0&&wt.endShadows(),this.info.autoReset===!0&&this.info.reset(),(z&&T.hasRenderPass())===!1){const Et=R.opaque,xt=R.transmissive;if(E.setupLights(),F.isArrayCamera){const Pt=F.cameras;if(xt.length>0)for(let Dt=0,Zt=Pt.length;Dt<Zt;Dt++){const jt=Pt[Dt];ul(Et,xt,b,jt)}ft&&at.render(b);for(let Dt=0,Zt=Pt.length;Dt<Zt;Dt++){const jt=Pt[Dt];hl(R,b,jt,jt.viewport)}}else xt.length>0&&ul(Et,xt,b,F),ft&&at.render(b),hl(R,b,F)}D!==null&&W===0&&(_.updateMultisampleRenderTarget(D),_.updateRenderTargetMipmap(D)),z&&T.end(I),b.isScene===!0&&b.onAfterRender(I,b,F),ot.resetDefaultState(),B=-1,k=null,y.pop(),y.length>0?(E=y[y.length-1],_.setTextureUnits(E.state.textureUnits),ae===!0&&wt.setGlobalState(I.clippingPlanes,E.state.camera)):E=null,P.pop(),P.length>0?R=P[P.length-1]:R=null,N!==null&&N.renderEnd()};function Xr(b,F,V,z){if(b.visible===!1)return;if(b.layers.test(F.layers)){if(b.isGroup)V=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(F);else if(b.isLightProbeGrid)E.pushLightProbeGrid(b);else if(b.isLight)E.pushLight(b),b.castShadow&&E.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||kt.intersectsSprite(b)){z&&j.setFromMatrixPosition(b.matrixWorld).applyMatrix4(K);const Et=rt.update(b),xt=b.material;xt.visible&&R.push(b,Et,xt,V,j.z,null)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||kt.intersectsObject(b))){const Et=rt.update(b),xt=b.material;if(z&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),j.copy(b.boundingSphere.center)):(Et.boundingSphere===null&&Et.computeBoundingSphere(),j.copy(Et.boundingSphere.center)),j.applyMatrix4(b.matrixWorld).applyMatrix4(K)),Array.isArray(xt)){const Pt=Et.groups;for(let Dt=0,Zt=Pt.length;Dt<Zt;Dt++){const jt=Pt[Dt],Ut=xt[jt.materialIndex];Ut&&Ut.visible&&R.push(b,Et,Ut,V,j.z,jt)}}else xt.visible&&R.push(b,Et,xt,V,j.z,null)}}const _t=b.children;for(let Et=0,xt=_t.length;Et<xt;Et++)Xr(_t[Et],F,V,z)}function hl(b,F,V,z){const{opaque:G,transmissive:_t,transparent:Et}=b;E.setupLightsView(V),ae===!0&&wt.setGlobalState(I.clippingPlanes,V),z&&st.viewport(J.copy(z)),G.length>0&&Hs(G,F,V),_t.length>0&&Hs(_t,F,V),Et.length>0&&Hs(Et,F,V),st.buffers.depth.setTest(!0),st.buffers.depth.setMask(!0),st.buffers.color.setMask(!0),st.setPolygonOffset(!1)}function ul(b,F,V,z){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[z.id]===void 0){const Ut=Rt.has("EXT_color_buffer_half_float")||Rt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[z.id]=new Cn(1,1,{generateMipmaps:!0,type:Ut?Yn:sn,minFilter:Si,samples:Math.max(4,Ht.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:se.workingColorSpace})}const _t=E.state.transmissionRenderTarget[z.id],Et=z.viewport||J;_t.setSize(Et.z*I.transmissionResolutionScale,Et.w*I.transmissionResolutionScale);const xt=I.getRenderTarget(),Pt=I.getActiveCubeFace(),Dt=I.getActiveMipmapLevel();I.setRenderTarget(_t),I.getClearColor(yt),At=I.getClearAlpha(),At<1&&I.setClearColor(16777215,.5),I.clear(),ft&&at.render(V);const Zt=I.toneMapping;I.toneMapping=An;const jt=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),E.setupLightsView(z),ae===!0&&wt.setGlobalState(I.clippingPlanes,z),Hs(b,V,z),_.updateMultisampleRenderTarget(_t),_.updateRenderTargetMipmap(_t),Rt.has("WEBGL_multisampled_render_to_texture")===!1){let Ut=!1;for(let de=0,be=F.length;de<be;de++){const ye=F[de],{object:fe,geometry:Be,material:bt,group:Qe}=ye;if(bt.side===xe&&fe.layers.test(z.layers)){const oe=bt.side;bt.side=Xe,bt.needsUpdate=!0,dl(fe,V,z,Be,bt,Qe),bt.side=oe,bt.needsUpdate=!0,Ut=!0}}Ut===!0&&(_.updateMultisampleRenderTarget(_t),_.updateRenderTargetMipmap(_t))}I.setRenderTarget(xt,Pt,Dt),I.setClearColor(yt,At),jt!==void 0&&(z.viewport=jt),I.toneMapping=Zt}function Hs(b,F,V){const z=F.isScene===!0?F.overrideMaterial:null;for(let G=0,_t=b.length;G<_t;G++){const Et=b[G],{object:xt,geometry:Pt,group:Dt}=Et;let Zt=Et.material;Zt.allowOverride===!0&&z!==null&&(Zt=z),xt.layers.test(V.layers)&&dl(xt,F,V,Pt,Zt,Dt)}}function dl(b,F,V,z,G,_t){b.onBeforeRender(I,F,V,z,G,_t),b.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),G.onBeforeRender(I,F,V,z,b,_t),G.transparent===!0&&G.side===xe&&G.forceSinglePass===!1?(G.side=Xe,G.needsUpdate=!0,I.renderBufferDirect(V,F,z,G,b,_t),G.side=fi,G.needsUpdate=!0,I.renderBufferDirect(V,F,z,G,b,_t),G.side=xe):I.renderBufferDirect(V,F,z,G,b,_t),b.onAfterRender(I,F,V,z,G,_t)}function Ws(b,F,V){F.isScene!==!0&&(F=vt);const z=w.get(b),G=E.state.lights,_t=E.state.shadowsArray,Et=G.state.version,xt=lt.getParameters(b,G.state,_t,F,V,E.state.lightProbeGridArray),Pt=lt.getProgramCacheKey(xt);let Dt=z.programs;z.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?F.environment:null,z.fog=F.fog;const Zt=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;z.envMap=O.get(b.envMap||z.environment,Zt),z.envMapRotation=z.environment!==null&&b.envMap===null?F.environmentRotation:b.envMapRotation,Dt===void 0&&(b.addEventListener("dispose",Se),Dt=new Map,z.programs=Dt);let jt=Dt.get(Pt);if(jt!==void 0){if(z.currentProgram===jt&&z.lightsStateVersion===Et)return pl(b,xt),jt}else xt.uniforms=lt.getUniforms(b),N!==null&&b.isNodeMaterial&&N.build(b,V,xt),b.onBeforeCompile(xt,I),jt=lt.acquireProgram(xt,Pt),Dt.set(Pt,jt),z.uniforms=xt.uniforms;const Ut=z.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Ut.clippingPlanes=wt.uniform),pl(b,xt),z.needsLights=gu(b),z.lightsStateVersion=Et,z.needsLights&&(Ut.ambientLightColor.value=G.state.ambient,Ut.lightProbe.value=G.state.probe,Ut.directionalLights.value=G.state.directional,Ut.directionalLightShadows.value=G.state.directionalShadow,Ut.spotLights.value=G.state.spot,Ut.spotLightShadows.value=G.state.spotShadow,Ut.rectAreaLights.value=G.state.rectArea,Ut.ltc_1.value=G.state.rectAreaLTC1,Ut.ltc_2.value=G.state.rectAreaLTC2,Ut.pointLights.value=G.state.point,Ut.pointLightShadows.value=G.state.pointShadow,Ut.hemisphereLights.value=G.state.hemi,Ut.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Ut.spotLightMatrix.value=G.state.spotLightMatrix,Ut.spotLightMap.value=G.state.spotLightMap,Ut.pointShadowMatrix.value=G.state.pointShadowMatrix),z.lightProbeGrid=E.state.lightProbeGridArray.length>0,z.currentProgram=jt,z.uniformsList=null,jt}function fl(b){if(b.uniformsList===null){const F=b.currentProgram.getUniforms();b.uniformsList=Tr.seqWithValue(F.seq,b.uniforms)}return b.uniformsList}function pl(b,F){const V=w.get(b);V.outputColorSpace=F.outputColorSpace,V.batching=F.batching,V.batchingColor=F.batchingColor,V.instancing=F.instancing,V.instancingColor=F.instancingColor,V.instancingMorph=F.instancingMorph,V.skinning=F.skinning,V.morphTargets=F.morphTargets,V.morphNormals=F.morphNormals,V.morphColors=F.morphColors,V.morphTargetsCount=F.morphTargetsCount,V.numClippingPlanes=F.numClippingPlanes,V.numIntersection=F.numClipIntersection,V.vertexAlphas=F.vertexAlphas,V.vertexTangents=F.vertexTangents,V.toneMapping=F.toneMapping}function fu(b,F){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;S.setFromMatrixPosition(F.matrixWorld);for(let V=0,z=b.length;V<z;V++){const G=b[V];if(G.texture!==null&&G.boundingBox.containsPoint(S))return G}return null}function pu(b,F,V,z,G){F.isScene!==!0&&(F=vt),_.resetTextureUnits();const _t=F.fog,Et=z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial?F.environment:null,xt=D===null?I.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:se.workingColorSpace,Pt=z.isMeshStandardMaterial||z.isMeshLambertMaterial&&!z.envMap||z.isMeshPhongMaterial&&!z.envMap,Dt=O.get(z.envMap||Et,Pt),Zt=z.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,jt=!!V.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),Ut=!!V.morphAttributes.position,de=!!V.morphAttributes.normal,be=!!V.morphAttributes.color;let ye=An;z.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(ye=I.toneMapping);const fe=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,Be=fe!==void 0?fe.length:0,bt=w.get(z),Qe=E.state.lights;if(ae===!0&&(Gt===!0||b!==k)){const me=b===k&&z.id===B;wt.setState(z,b,me)}let oe=!1;z.version===bt.__version?(bt.needsLights&&bt.lightsStateVersion!==Qe.state.version||bt.outputColorSpace!==xt||G.isBatchedMesh&&bt.batching===!1||!G.isBatchedMesh&&bt.batching===!0||G.isBatchedMesh&&bt.batchingColor===!0&&G.colorTexture===null||G.isBatchedMesh&&bt.batchingColor===!1&&G.colorTexture!==null||G.isInstancedMesh&&bt.instancing===!1||!G.isInstancedMesh&&bt.instancing===!0||G.isSkinnedMesh&&bt.skinning===!1||!G.isSkinnedMesh&&bt.skinning===!0||G.isInstancedMesh&&bt.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&bt.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&bt.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&bt.instancingMorph===!1&&G.morphTexture!==null||bt.envMap!==Dt||z.fog===!0&&bt.fog!==_t||bt.numClippingPlanes!==void 0&&(bt.numClippingPlanes!==wt.numPlanes||bt.numIntersection!==wt.numIntersection)||bt.vertexAlphas!==Zt||bt.vertexTangents!==jt||bt.morphTargets!==Ut||bt.morphNormals!==de||bt.morphColors!==be||bt.toneMapping!==ye||bt.morphTargetsCount!==Be||!!bt.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(oe=!0):(oe=!0,bt.__version=z.version);let on=bt.currentProgram;oe===!0&&(on=Ws(z,F,G),N&&z.isNodeMaterial&&N.onUpdateProgram(z,on,bt));let yn=!1,ti=!1,Ui=!1;const pe=on.getUniforms(),we=bt.uniforms;if(st.useProgram(on.program)&&(yn=!0,ti=!0,Ui=!0),z.id!==B&&(B=z.id,ti=!0),bt.needsLights){const me=fu(E.state.lightProbeGridArray,G);bt.lightProbeGrid!==me&&(bt.lightProbeGrid=me,ti=!0)}if(yn||k!==b){st.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),pe.setValue(L,"projectionMatrix",b.projectionMatrix),pe.setValue(L,"viewMatrix",b.matrixWorldInverse);const ni=pe.map.cameraPosition;ni!==void 0&&ni.setValue(L,nt.setFromMatrixPosition(b.matrixWorld)),Ht.logarithmicDepthBuffer&&pe.setValue(L,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&pe.setValue(L,"isOrthographic",b.isOrthographicCamera===!0),k!==b&&(k=b,ti=!0,Ui=!0)}if(bt.needsLights&&(Qe.state.directionalShadowMap.length>0&&pe.setValue(L,"directionalShadowMap",Qe.state.directionalShadowMap,_),Qe.state.spotShadowMap.length>0&&pe.setValue(L,"spotShadowMap",Qe.state.spotShadowMap,_),Qe.state.pointShadowMap.length>0&&pe.setValue(L,"pointShadowMap",Qe.state.pointShadowMap,_)),G.isSkinnedMesh){pe.setOptional(L,G,"bindMatrix"),pe.setOptional(L,G,"bindMatrixInverse");const me=G.skeleton;me&&(me.boneTexture===null&&me.computeBoneTexture(),pe.setValue(L,"boneTexture",me.boneTexture,_))}G.isBatchedMesh&&(pe.setOptional(L,G,"batchingTexture"),pe.setValue(L,"batchingTexture",G._matricesTexture,_),pe.setOptional(L,G,"batchingIdTexture"),pe.setValue(L,"batchingIdTexture",G._indirectTexture,_),pe.setOptional(L,G,"batchingColorTexture"),G._colorsTexture!==null&&pe.setValue(L,"batchingColorTexture",G._colorsTexture,_));const ei=V.morphAttributes;if((ei.position!==void 0||ei.normal!==void 0||ei.color!==void 0)&&Xt.update(G,V,on),(ti||bt.receiveShadow!==G.receiveShadow)&&(bt.receiveShadow=G.receiveShadow,pe.setValue(L,"receiveShadow",G.receiveShadow)),(z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial)&&z.envMap===null&&F.environment!==null&&(we.envMapIntensity.value=F.environmentIntensity),we.dfgLUT!==void 0&&(we.dfgLUT.value=Lx()),ti){if(pe.setValue(L,"toneMappingExposure",I.toneMappingExposure),bt.needsLights&&mu(we,Ui),_t&&z.fog===!0&&X.refreshFogUniforms(we,_t),X.refreshMaterialUniforms(we,z,Bt,ie,E.state.transmissionRenderTarget[b.id]),bt.needsLights&&bt.lightProbeGrid){const me=bt.lightProbeGrid;we.probesSH.value=me.texture,we.probesMin.value.copy(me.boundingBox.min),we.probesMax.value.copy(me.boundingBox.max),we.probesResolution.value.copy(me.resolution)}Tr.upload(L,fl(bt),we,_)}if(z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(Tr.upload(L,fl(bt),we,_),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&pe.setValue(L,"center",G.center),pe.setValue(L,"modelViewMatrix",G.modelViewMatrix),pe.setValue(L,"normalMatrix",G.normalMatrix),pe.setValue(L,"modelMatrix",G.matrixWorld),z.uniformsGroups!==void 0){const me=z.uniformsGroups;for(let ni=0,Ni=me.length;ni<Ni;ni++){const ml=me[ni];$.update(ml,on),$.bind(ml,on)}}return on}function mu(b,F){b.ambientLightColor.needsUpdate=F,b.lightProbe.needsUpdate=F,b.directionalLights.needsUpdate=F,b.directionalLightShadows.needsUpdate=F,b.pointLights.needsUpdate=F,b.pointLightShadows.needsUpdate=F,b.spotLights.needsUpdate=F,b.spotLightShadows.needsUpdate=F,b.rectAreaLights.needsUpdate=F,b.hemisphereLights.needsUpdate=F}function gu(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return H},this.getActiveMipmapLevel=function(){return W},this.getRenderTarget=function(){return D},this.setRenderTargetTextures=function(b,F,V){const z=w.get(b);z.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,z.__autoAllocateDepthBuffer===!1&&(z.__useRenderToTexture=!1),w.get(b.texture).__webglTexture=F,w.get(b.depthTexture).__webglTexture=z.__autoAllocateDepthBuffer?void 0:V,z.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,F){const V=w.get(b);V.__webglFramebuffer=F,V.__useDefaultFramebuffer=F===void 0};const xu=L.createFramebuffer();this.setRenderTarget=function(b,F=0,V=0){D=b,H=F,W=V;let z=null,G=!1,_t=!1;if(b){const xt=w.get(b);if(xt.__useDefaultFramebuffer!==void 0){st.bindFramebuffer(L.FRAMEBUFFER,xt.__webglFramebuffer),J.copy(b.viewport),et.copy(b.scissor),dt=b.scissorTest,st.viewport(J),st.scissor(et),st.setScissorTest(dt),B=-1;return}else if(xt.__webglFramebuffer===void 0)_.setupRenderTarget(b);else if(xt.__hasExternalTextures)_.rebindTextures(b,w.get(b.texture).__webglTexture,w.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){const Zt=b.depthTexture;if(xt.__boundDepthTexture!==Zt){if(Zt!==null&&w.has(Zt)&&(b.width!==Zt.image.width||b.height!==Zt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");_.setupDepthRenderbuffer(b)}}const Pt=b.texture;(Pt.isData3DTexture||Pt.isDataArrayTexture||Pt.isCompressedArrayTexture)&&(_t=!0);const Dt=w.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Dt[F])?z=Dt[F][V]:z=Dt[F],G=!0):b.samples>0&&_.useMultisampledRTT(b)===!1?z=w.get(b).__webglMultisampledFramebuffer:Array.isArray(Dt)?z=Dt[V]:z=Dt,J.copy(b.viewport),et.copy(b.scissor),dt=b.scissorTest}else J.copy(it).multiplyScalar(Bt).floor(),et.copy(Ct).multiplyScalar(Bt).floor(),dt=Ft;if(V!==0&&(z=xu),st.bindFramebuffer(L.FRAMEBUFFER,z)&&st.drawBuffers(b,z),st.viewport(J),st.scissor(et),st.setScissorTest(dt),G){const xt=w.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+F,xt.__webglTexture,V)}else if(_t){const xt=F;for(let Pt=0;Pt<b.textures.length;Pt++){const Dt=w.get(b.textures[Pt]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+Pt,Dt.__webglTexture,V,xt)}}else if(b!==null&&V!==0){const xt=w.get(b.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,xt.__webglTexture,V)}B=-1},this.readRenderTargetPixels=function(b,F,V,z,G,_t,Et,xt=0){if(!(b&&b.isWebGLRenderTarget)){re("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Pt=w.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Et!==void 0&&(Pt=Pt[Et]),Pt){st.bindFramebuffer(L.FRAMEBUFFER,Pt);try{const Dt=b.textures[xt],Zt=Dt.format,jt=Dt.type;if(b.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+xt),!Ht.textureFormatReadable(Zt)){re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ht.textureTypeReadable(jt)){re("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=b.width-z&&V>=0&&V<=b.height-G&&L.readPixels(F,V,z,G,U.convert(Zt),U.convert(jt),_t)}finally{const Dt=D!==null?w.get(D).__webglFramebuffer:null;st.bindFramebuffer(L.FRAMEBUFFER,Dt)}}},this.readRenderTargetPixelsAsync=async function(b,F,V,z,G,_t,Et,xt=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Pt=w.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Et!==void 0&&(Pt=Pt[Et]),Pt)if(F>=0&&F<=b.width-z&&V>=0&&V<=b.height-G){st.bindFramebuffer(L.FRAMEBUFFER,Pt);const Dt=b.textures[xt],Zt=Dt.format,jt=Dt.type;if(b.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+xt),!Ht.textureFormatReadable(Zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ht.textureTypeReadable(jt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ut=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,Ut),L.bufferData(L.PIXEL_PACK_BUFFER,_t.byteLength,L.STREAM_READ),L.readPixels(F,V,z,G,U.convert(Zt),U.convert(jt),0);const de=D!==null?w.get(D).__webglFramebuffer:null;st.bindFramebuffer(L.FRAMEBUFFER,de);const be=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await td(L,be,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,Ut),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,_t),L.deleteBuffer(Ut),L.deleteSync(be),_t}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,F=null,V=0){const z=Math.pow(2,-V),G=Math.floor(b.image.width*z),_t=Math.floor(b.image.height*z),Et=F!==null?F.x:0,xt=F!==null?F.y:0;_.setTexture2D(b,0),L.copyTexSubImage2D(L.TEXTURE_2D,V,0,0,Et,xt,G,_t),st.unbindTexture()};const vu=L.createFramebuffer(),_u=L.createFramebuffer();this.copyTextureToTexture=function(b,F,V=null,z=null,G=0,_t=0){let Et,xt,Pt,Dt,Zt,jt,Ut,de,be;const ye=b.isCompressedTexture?b.mipmaps[_t]:b.image;if(V!==null)Et=V.max.x-V.min.x,xt=V.max.y-V.min.y,Pt=V.isBox3?V.max.z-V.min.z:1,Dt=V.min.x,Zt=V.min.y,jt=V.isBox3?V.min.z:0;else{const we=Math.pow(2,-G);Et=Math.floor(ye.width*we),xt=Math.floor(ye.height*we),b.isDataArrayTexture?Pt=ye.depth:b.isData3DTexture?Pt=Math.floor(ye.depth*we):Pt=1,Dt=0,Zt=0,jt=0}z!==null?(Ut=z.x,de=z.y,be=z.z):(Ut=0,de=0,be=0);const fe=U.convert(F.format),Be=U.convert(F.type);let bt;F.isData3DTexture?(_.setTexture3D(F,0),bt=L.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(_.setTexture2DArray(F,0),bt=L.TEXTURE_2D_ARRAY):(_.setTexture2D(F,0),bt=L.TEXTURE_2D),st.activeTexture(L.TEXTURE0),st.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,F.flipY),st.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),st.pixelStorei(L.UNPACK_ALIGNMENT,F.unpackAlignment);const Qe=st.getParameter(L.UNPACK_ROW_LENGTH),oe=st.getParameter(L.UNPACK_IMAGE_HEIGHT),on=st.getParameter(L.UNPACK_SKIP_PIXELS),yn=st.getParameter(L.UNPACK_SKIP_ROWS),ti=st.getParameter(L.UNPACK_SKIP_IMAGES);st.pixelStorei(L.UNPACK_ROW_LENGTH,ye.width),st.pixelStorei(L.UNPACK_IMAGE_HEIGHT,ye.height),st.pixelStorei(L.UNPACK_SKIP_PIXELS,Dt),st.pixelStorei(L.UNPACK_SKIP_ROWS,Zt),st.pixelStorei(L.UNPACK_SKIP_IMAGES,jt);const Ui=b.isDataArrayTexture||b.isData3DTexture,pe=F.isDataArrayTexture||F.isData3DTexture;if(b.isDepthTexture){const we=w.get(b),ei=w.get(F),me=w.get(we.__renderTarget),ni=w.get(ei.__renderTarget);st.bindFramebuffer(L.READ_FRAMEBUFFER,me.__webglFramebuffer),st.bindFramebuffer(L.DRAW_FRAMEBUFFER,ni.__webglFramebuffer);for(let Ni=0;Ni<Pt;Ni++)Ui&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,w.get(b).__webglTexture,G,jt+Ni),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,w.get(F).__webglTexture,_t,be+Ni)),L.blitFramebuffer(Dt,Zt,Et,xt,Ut,de,Et,xt,L.DEPTH_BUFFER_BIT,L.NEAREST);st.bindFramebuffer(L.READ_FRAMEBUFFER,null),st.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(G!==0||b.isRenderTargetTexture||w.has(b)){const we=w.get(b),ei=w.get(F);st.bindFramebuffer(L.READ_FRAMEBUFFER,vu),st.bindFramebuffer(L.DRAW_FRAMEBUFFER,_u);for(let me=0;me<Pt;me++)Ui?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,we.__webglTexture,G,jt+me):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,we.__webglTexture,G),pe?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,ei.__webglTexture,_t,be+me):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,ei.__webglTexture,_t),G!==0?L.blitFramebuffer(Dt,Zt,Et,xt,Ut,de,Et,xt,L.COLOR_BUFFER_BIT,L.NEAREST):pe?L.copyTexSubImage3D(bt,_t,Ut,de,be+me,Dt,Zt,Et,xt):L.copyTexSubImage2D(bt,_t,Ut,de,Dt,Zt,Et,xt);st.bindFramebuffer(L.READ_FRAMEBUFFER,null),st.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else pe?b.isDataTexture||b.isData3DTexture?L.texSubImage3D(bt,_t,Ut,de,be,Et,xt,Pt,fe,Be,ye.data):F.isCompressedArrayTexture?L.compressedTexSubImage3D(bt,_t,Ut,de,be,Et,xt,Pt,fe,ye.data):L.texSubImage3D(bt,_t,Ut,de,be,Et,xt,Pt,fe,Be,ye):b.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,_t,Ut,de,Et,xt,fe,Be,ye.data):b.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,_t,Ut,de,ye.width,ye.height,fe,ye.data):L.texSubImage2D(L.TEXTURE_2D,_t,Ut,de,Et,xt,fe,Be,ye);st.pixelStorei(L.UNPACK_ROW_LENGTH,Qe),st.pixelStorei(L.UNPACK_IMAGE_HEIGHT,oe),st.pixelStorei(L.UNPACK_SKIP_PIXELS,on),st.pixelStorei(L.UNPACK_SKIP_ROWS,yn),st.pixelStorei(L.UNPACK_SKIP_IMAGES,ti),_t===0&&F.generateMipmaps&&L.generateMipmap(bt),st.unbindTexture()},this.initRenderTarget=function(b){w.get(b).__webglFramebuffer===void 0&&_.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?_.setTextureCube(b,0):b.isData3DTexture?_.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?_.setTexture2DArray(b,0):_.setTexture2D(b,0),st.unbindTexture()},this.resetState=function(){H=0,W=0,D=null,st.reset(),ot.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return En}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=se._getDrawingBufferColorSpace(t),e.unpackColorSpace=se._getUnpackColorSpace()}}class Dx{keys=new Set;restartPressed=!1;pausePressed=!1;cameraPressed=!1;stickThrottle=0;stickSteer=0;onKeyDown=t=>{t.code==="Space"&&t.preventDefault(),this.keys.add(t.code),t.code==="KeyR"&&(this.restartPressed=!0),t.code==="Escape"&&(this.pausePressed=!0),t.code==="KeyC"&&(this.cameraPressed=!0)};onKeyUp=t=>{this.keys.delete(t.code)};onBlur=()=>{this.keys.clear()};constructor(t,e,n,s){window.addEventListener("keydown",this.onKeyDown),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("blur",this.onBlur),t&&e&&this.bindStick(t,e),n&&this.bindHold(n,r=>{this.touchBoost=r}),s&&this.bindHold(s,r=>{this.touchDrift=r})}touchBoost=!1;touchDrift=!1;pointerId=null;stickCenterX=0;stickCenterY=0;stickRadius=1;bindStick(t,e){const n=a=>{a.preventDefault(),this.pointerId=a.pointerId;const o=t.getBoundingClientRect();this.stickCenterX=o.left+o.width/2,this.stickCenterY=o.top+o.height/2,this.stickRadius=o.width*.4;try{t.setPointerCapture(a.pointerId)}catch{}this.applyStick(a.clientX,a.clientY,e)},s=a=>{this.pointerId===a.pointerId&&(a.preventDefault(),this.applyStick(a.clientX,a.clientY,e))},r=a=>{this.pointerId===a.pointerId&&(this.pointerId=null,this.stickThrottle=0,this.stickSteer=0,e.style.transform="translate(-50%, -50%)")};t.addEventListener("pointerdown",n),t.addEventListener("pointermove",s),t.addEventListener("pointerup",r),t.addEventListener("pointercancel",r)}applyStick(t,e,n){let s=(t-this.stickCenterX)/this.stickRadius,r=(e-this.stickCenterY)/this.stickRadius;const a=Math.hypot(s,r);a>1&&(s/=a,r/=a),this.stickSteer=s,this.stickThrottle=-r,n.style.transform=`translate(calc(-50% + ${s*36}px), calc(-50% + ${r*36}px))`}bindHold(t,e){t.addEventListener("pointerdown",s=>{s.preventDefault(),e(!0);try{t.setPointerCapture(s.pointerId)}catch{}});const n=s=>{s.preventDefault(),e(!1)};t.addEventListener("pointerup",n),t.addEventListener("pointercancel",n),t.addEventListener("pointerleave",n)}readIntent(){let t=0;(this.keys.has("KeyW")||this.keys.has("ArrowUp"))&&(t+=1),(this.keys.has("KeyS")||this.keys.has("ArrowDown"))&&(t-=1),t+=this.stickThrottle,t=Math.max(-1,Math.min(1,t));let e=0;(this.keys.has("KeyA")||this.keys.has("ArrowLeft"))&&(e-=1),(this.keys.has("KeyD")||this.keys.has("ArrowRight"))&&(e+=1),e+=this.stickSteer,e=Math.max(-1,Math.min(1,e));const n={throttle:t,steer:e,brake:this.keys.has("KeyS")||this.keys.has("ArrowDown"),drift:this.keys.has("Space")||this.touchDrift,boost:this.keys.has("ShiftLeft")||this.keys.has("ShiftRight")||this.touchBoost,restart:this.restartPressed,pause:this.pausePressed,camera:this.cameraPressed};return this.restartPressed=!1,this.pausePressed=!1,this.cameraPressed=!1,n}dispose(){window.removeEventListener("keydown",this.onKeyDown),window.removeEventListener("keyup",this.onKeyUp),window.removeEventListener("blur",this.onBlur)}}class Ux{constructor(t,e){this.update=t,this.render=e}frameId=0;lastTime=0;running=!1;start(){this.running||(this.running=!0,this.lastTime=performance.now(),this.frameId=requestAnimationFrame(this.tick))}stop(){this.running=!1,cancelAnimationFrame(this.frameId)}tick=t=>{if(!this.running)return;const e=Math.min((t-this.lastTime)/1e3,.05);this.lastTime=t,this.update(e,t/1e3),this.render(),this.frameId=requestAnimationFrame(this.tick)}}function Nx(i){const t=new Ix({canvas:i,antialias:!0,alpha:!1,powerPreference:"high-performance"});return t.outputColorSpace=Re,t.toneMapping=No,t.toneMappingExposure=1.05,t.shadowMap.enabled=!0,t.shadowMap.type=ws,t}function Ca(i,t,e=2){const n=i.domElement,s=Math.max(1,Math.floor(n.clientWidth)),r=Math.max(1,Math.floor(n.clientHeight)),a=Math.min(window.devicePixelRatio||1,e),o=Math.floor(s*a),l=Math.floor(r*a),c=n.width!==o||n.height!==l;return c&&(i.setPixelRatio(a),i.setSize(s,r,!1),t.aspect=s/r,t.updateProjectionMatrix()),c}function Vs(i,t=!1){const e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},a={},o=i[0].morphTargetsRelative,l=new _e;let c=0;for(let h=0;h<i.length;++h){const u=i[h];let d=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in u.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[f]===void 0&&(a[f]=[]),a[f].push(u.morphAttributes[f])}if(t){let f;if(e)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(e){let h=0;const u=[];for(let d=0;d<i.length;++d){const f=i[d].index;for(let p=0;p<f.count;++p)u.push(f.getX(p)+h);h+=i[d].attributes.position.count}l.setIndex(u)}for(const h in r){const u=Pc(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(const h in a){const u=a[h][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){const f=[];for(let x=0;x<a[h].length;++x)f.push(a[h][x][d]);const p=Pc(f);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(p)}}}return l}function Pc(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){const h=i[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*e}const a=new t(r),o=new Ze(a,e,n);let l=0;for(let c=0;c<i.length;++c){const h=i[c];if(h.isInterleavedBufferAttribute){const u=l/e;for(let d=0,f=h.count;d<f;d++)for(let p=0;p<e;p++){const x=h.getComponent(d,p);o.setComponent(d+u,p,x)}}else a.set(h.array,l);l+=h.count*e}return s!==void 0&&(o.gpuType=s),o}const Lc=new Map,Ic=new Map;function mt(i,t){let e=Lc.get(i);return e||(e=t(),Lc.set(i,e)),e}function vn(i,t){let e=Ic.get(i);return e||(e=t(),Ic.set(i,e)),e}function Lt(i,t){return vn(`std:${i}`,()=>new Ce(t))}function Ke(i,t){const e=new ee,n=new un,s=new je,r=new A,a=new A;t.forEach((o,l)=>{r.copy(o.position),s.set(o.rotationX??0,o.rotationY??0,o.rotationZ??0),n.setFromEuler(s),typeof o.scale=="number"?a.setScalar(o.scale):o.scale?a.copy(o.scale):a.set(1,1,1),e.compose(r,n,a),i.setMatrixAt(l,e)}),i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere()}function zt(i,t,e,n=.05){const s=new rn,r=i/2,a=t/2,o=Math.min(n,Math.min(i,t)/2-.001);s.moveTo(-r+o,-a),s.lineTo(r-o,-a),s.quadraticCurveTo(r,-a,r,-a+o),s.lineTo(r,a-o),s.quadraticCurveTo(r,a,r-o,a),s.lineTo(-r+o,a),s.quadraticCurveTo(-r,a,-r,a-o),s.lineTo(-r,-a+o),s.quadraticCurveTo(-r,-a,-r+o,-a);const l=new Rn(s,{depth:e-o*2,bevelEnabled:!0,bevelThickness:o,bevelSize:o,bevelSegments:1,steps:1});return l.translate(0,0,-(e-o*2)/2),l}const Dc=new Map;function Jn(i,t){const e=document.createElement("canvas");e.width=i,e.height=t;const n=e.getContext("2d");return{canvas:e,ctx:n}}function jn(i,t=!0){const e=new ls(i);return t&&(e.colorSpace=Re),e.wrapS=Ti,e.wrapT=Ti,e.anisotropy=4,e}function Qn(i,t){let e=Dc.get(i);return e||(e=t(),Dc.set(i,e)),e}function os(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Fx(i){return Qn(`road:${i.style}:${i.roadBase}:${i.roadMark}:${i.edgeA}:${i.edgeB}`,()=>{const{canvas:n,ctx:s}=Jn(512,512),r=os(i.style.length*7717+42);s.fillStyle=i.roadBase,s.fillRect(0,0,512,512);for(let l=0;l<2400;l+=1){const c=r()*512,h=r()*512,u=.03+r()*.05;s.fillStyle=r()>.5?`rgba(255,255,255,${u})`:`rgba(0,0,0,${u})`,s.fillRect(c,h,1+r()*2,1+r()*2)}const a=22,o=32;for(let l=0;l<512;l+=o){const c=l/o%2===0;s.fillStyle=c?i.edgeB:"#0a0a0a",s.fillRect(0,l,a,o),s.fillStyle=c?i.edgeA:"#0a0a0a",s.fillRect(512-a,l,a,o)}s.fillStyle="rgba(0,0,0,0.4)",s.fillRect(a,0,3,512),s.fillRect(512-a-3,0,3,512),s.fillStyle="rgba(0,0,0,0.16)";for(let l=0;l<512;l+=128)s.fillRect(0,l,512,2);s.fillStyle=i.roadMark;for(let l=0;l<512;l+=64)s.fillRect(512/2-5,l,10,40);if(s.fillStyle="rgba(255,255,255,0.16)",s.fillRect(48,0,4,512),s.fillRect(460,0,4,512),i.style==="pop")for(let l=0;l<512;l+=16)for(let c=a+10;c<512-a-10;c+=16){const h=Math.abs(c-256)/256;r()<.12*h&&(s.fillStyle="rgba(0,0,0,0.18)",s.beginPath(),s.arc(c,l,2.4,0,Math.PI*2),s.fill())}if(i.style==="monet"){const l=s.createLinearGradient(0,0,0,512);l.addColorStop(0,"rgba(245, 200, 180, 0.18)"),l.addColorStop(.5,"rgba(180, 200, 220, 0.10)"),l.addColorStop(1,"rgba(245, 220, 170, 0.18)"),s.fillStyle=l,s.fillRect(0,0,512,512)}if(i.style==="rain"){for(let l=0;l<60;l+=1){const c=a+20+r()*(512-a*2-40),h=r()*512,u=40+r()*120;s.fillStyle=`rgba(140, 190, 255, ${.05+r()*.09})`,s.fillRect(c,h,2+r()*3,u)}s.fillStyle="rgba(10, 14, 26, 0.35)",s.fillRect(0,0,512,512),s.globalAlpha=.16,s.fillStyle=i.edgeA,s.fillRect(a+4,0,10,512),s.fillStyle=i.edgeB,s.fillRect(512-a-14,0,10,512),s.globalAlpha=1}if(i.style==="ink"){for(let l=0;l<90;l+=1){s.globalAlpha=.05+r()*.09,s.fillStyle=r()>.35?"#5c564d":"#7a746a";const c=r()*512,h=r()*512;s.beginPath(),s.ellipse(c,h,14+r()*40,8+r()*16,r()*Math.PI,0,Math.PI*2),s.fill()}s.globalAlpha=1}if(i.style==="pixel")for(let l=0;l<512;l+=32)for(let c=a;c<512-a;c+=32)(c/32+l/32)%2===0&&(s.fillStyle="rgba(255,255,255,0.05)",s.fillRect(c,l,32,32));return jn(n)})}function Ox(){return Qn("checker",()=>{const{canvas:t,ctx:e}=Jn(128,128),n=128/8;for(let s=0;s<8;s+=1)for(let r=0;r<8;r+=1)e.fillStyle=(r+s)%2===0?"#ffffff":"#12081f",e.fillRect(r*n,s*n,n,n);return jn(t)})}function Yh(i,t,e){return Qn(`poster:${e}:${i}:${t}`,()=>{const{canvas:r,ctx:a}=Jn(512,256),o=os(i.length*991+7);if(e==="rain"){a.fillStyle="#0b0d18",a.fillRect(0,0,512,256),a.strokeStyle=t,a.lineWidth=6,a.strokeRect(14,14,484,228),a.globalAlpha=.5;for(let l=0;l<8;l+=1)a.fillStyle=l%2===0?t:"#ffffff",a.fillRect(20,20+o()*196,472,2);a.globalAlpha=1,a.fillStyle="#ffffff",a.font="bold 88px sans-serif",a.textAlign="center",a.textBaseline="middle",a.shadowColor=t,a.shadowBlur=24,a.fillText(i,512/2,256/2),a.shadowBlur=0}else if(e==="ink"){a.fillStyle="#f2eee2",a.fillRect(0,0,512,256),a.globalAlpha=.85;for(let l=0;l<26;l+=1){a.fillStyle="#3a3833";const c=40+o()*432,h=30+o()*196;a.beginPath(),a.ellipse(c,h,6+o()*16,3+o()*7,o()*Math.PI,0,Math.PI*2),a.fill()}a.globalAlpha=1,a.fillStyle="#1d1c1a",a.font="bold 90px sans-serif",a.textAlign="center",a.textBaseline="middle",a.fillText(i,512/2,256/2),a.fillStyle="#b03a2e",a.fillRect(438,182,44,44),a.fillStyle="#f2eee2",a.font="bold 24px sans-serif",a.fillText("印",460,206)}else if(e==="pixel"){a.fillStyle="#1c2140",a.fillRect(0,0,512,256);const l=16;a.fillStyle=t;for(let c=0;c<2;c+=1){for(let h=0;h<512/l;h+=1)a.fillRect(h*l,c*l,l,l);for(let h=0;h<512/l;h+=1)a.fillRect(h*l,256-(c+1)*l,l,l)}for(let c=0;c<256/l;c+=1)a.fillRect(0,c*l,l,l),a.fillRect(512-l,c*l,l,l);a.fillStyle="#ffffff",a.font="bold 80px monospace",a.textAlign="center",a.textBaseline="middle",a.fillText(i,512/2,256/2),a.fillStyle=t;for(let c=0;c<14;c+=1)a.fillRect(Math.floor(o()*(512/l))*l,Math.floor(o()*(256/l))*l,l,l)}else if(e==="minimal")a.fillStyle="#ffffff",a.fillRect(0,0,512,256),a.strokeStyle="#22262b",a.lineWidth=4,a.strokeRect(24,24,464,208),a.fillStyle=t,a.fillRect(24,24,14,208),a.fillStyle="#22262b",a.font="bold 72px sans-serif",a.textAlign="center",a.textBaseline="middle",a.fillText(i,512/2,256/2-10),a.fillStyle="#9aa0a8",a.font="bold 24px sans-serif",a.fillText("NEON DRIFT GP",512/2,256/2+52);else if(e==="pop"){a.fillStyle="#fff6e0",a.fillRect(0,0,512,256),a.fillStyle=t;for(let h=12;h<256;h+=22)for(let u=12;u<512;u+=22)a.beginPath(),a.arc(u,h,4,0,Math.PI*2),a.fill();a.fillStyle="#fff6e0",a.beginPath();const l=512/2,c=256/2;for(let h=0;h<16;h+=1){const u=h/16*Math.PI*2,d=h%2===0?150:105,f=l+Math.cos(u)*d*1.6,p=c+Math.sin(u)*d*.7;h===0?a.moveTo(f,p):a.lineTo(f,p)}a.closePath(),a.fill(),a.lineWidth=10,a.strokeStyle="#111111",a.stroke(),a.fillStyle="#111111",a.font='bold 88px "Arial Black", sans-serif',a.textAlign="center",a.textBaseline="middle",a.fillText(i,l,c+4),a.lineWidth=14,a.strokeStyle="#111111",a.strokeRect(8,8,496,240)}else if(e==="soviet")a.fillStyle="#f2e6c8",a.fillRect(0,0,512,256),a.fillStyle=t,a.beginPath(),a.moveTo(0,256),a.lineTo(512,256*.25),a.lineTo(512,256),a.closePath(),a.fill(),a.fillStyle="#1d1d1b",a.fillRect(0,256*.12,512,14),a.fillStyle=t,a.font="bold 92px sans-serif",a.textAlign="center",a.textBaseline="middle",a.save(),a.translate(512/2,256/2-14),a.transform(1,0,-.12,1,0,0),a.fillText(i,0,0),a.restore(),a.fillStyle="#1d1d1b",a.font="bold 30px sans-serif",a.textAlign="left",a.fillText("GP · 1924",24,230),a.lineWidth=8,a.strokeStyle="#1d1d1b",a.strokeRect(8,8,496,240);else if(e==="monet"){a.fillStyle="#f0e6d8",a.fillRect(0,0,512,256);const l=os(i.length*991+7),c=[t,"#a3c4e4","#e8a0bf","#9db89a","#f5c6d6"];for(let h=0;h<260;h+=1){a.globalAlpha=.16+l()*.2,a.fillStyle=c[Math.floor(l()*c.length)];const u=l()*512,d=l()*256;a.save(),a.translate(u,d),a.rotate((l()-.5)*1.2),a.fillRect(-30-l()*30,-6,60+l()*60,12),a.restore()}a.globalAlpha=1,a.fillStyle="rgba(70, 60, 90, 0.85)",a.font="italic bold 84px Georgia, serif",a.textAlign="center",a.textBaseline="middle",a.fillText(i,512/2,256/2)}else e==="anime"?(a.fillStyle="#1d2333",a.fillRect(0,0,512,256),a.strokeStyle=t,a.lineWidth=8,a.strokeRect(14,14,484,228),a.fillStyle=t,a.font="bold 92px sans-serif",a.textAlign="center",a.textBaseline="middle",a.shadowColor=t,a.shadowBlur=26,a.fillText(i,512/2,256/2),a.shadowBlur=0,a.fillStyle="rgba(255,255,255,0.75)",a.font="bold 26px sans-serif",a.fillText("· · · · · · · · · ·",512/2,222)):e==="void"?(a.fillStyle="rgba(8, 4, 20, 0.94)",a.fillRect(0,0,512,256),a.strokeStyle=t,a.lineWidth=12,a.strokeRect(10,10,492,236),a.fillStyle=t,a.font="bold 96px sans-serif",a.textAlign="center",a.textBaseline="middle",a.shadowColor=t,a.shadowBlur=24,a.fillText(i,512/2,256/2)):(a.fillStyle="rgba(8, 4, 20, 0.92)",a.fillRect(0,0,512,256),a.strokeStyle=t,a.lineWidth=12,a.strokeRect(10,10,492,236),a.fillStyle=t,a.font="bold 96px sans-serif",a.textAlign="center",a.textBaseline="middle",a.shadowColor=t,a.shadowBlur=24,a.fillText(i,512/2,256/2));return jn(r)})}function Uc(i,t){return Qn(`halftone:${i}:${t}`,()=>{const{canvas:n,ctx:s}=Jn(256,256);s.fillStyle=i,s.fillRect(0,0,256,256),s.fillStyle=t;const r=24;for(let a=0;a<256;a+=r)for(let o=0;o<256;o+=r){const l=a/r%2===0?0:r/2;s.beginPath(),s.arc(o+l,a,5.5,0,Math.PI*2),s.fill()}return jn(n)})}function Nc(i,t){return Qn(`water:${i}:${t}`,()=>{const{canvas:s,ctx:r}=Jn(512,512);r.fillStyle=i,r.fillRect(0,0,512,512);const a=os(1962),o=[t,"#cdb4de","#e8a0bf","#f5e6c8","#9db89a"];for(let l=0;l<380;l+=1){r.globalAlpha=.05+a()*.13,r.fillStyle=o[Math.floor(a()*o.length)];const c=a()*512,h=a()*512,u=70+a()*190;r.fillRect(h,c,u,3+a()*6)}return r.globalAlpha=1,jn(s)})}function kx(i,t){return Qn(`field:${i}:${t}`,()=>{const{canvas:s,ctx:r}=Jn(512,512);r.fillStyle=i,r.fillRect(0,0,512,512);const a=os(1917);r.globalAlpha=.12;for(let o=0;o<160;o+=1){r.fillStyle=a()>.5?"#8a7a55":"#f2e6c8";const l=a()*512;r.fillRect(0,l,512,4+a()*8)}r.globalAlpha=1;for(let o=0;o<5;o+=1){r.globalAlpha=.5,r.fillStyle=t;const l=a()*512,c=a()*512;r.beginPath(),r.moveTo(l,c),r.lineTo(l+60+a()*50,c+14),r.lineTo(l+8,c+22),r.closePath(),r.fill()}return r.globalAlpha=1,jn(s)})}function Bx(i,t){return Qn(`paper:${i}:${t}`,()=>{const{canvas:s,ctx:r}=Jn(512,512);r.fillStyle=i,r.fillRect(0,0,512,512);const a=os(772);for(let o=0;o<120;o+=1){r.globalAlpha=.05+a()*.1,r.fillStyle=t;const l=a()*512,c=a()*512;r.save(),r.translate(l,c),r.rotate((a()-.5)*.6),r.fillRect(-20-a()*30,-2,40+a()*60,3+a()*4),r.restore()}r.globalAlpha=.08;for(let o=0;o<400;o+=1)r.fillStyle=a()>.5?"#ffffff":t,r.fillRect(a()*512,a()*512,1.5,1.5);return r.globalAlpha=1,jn(s)})}function zx(){return Qn("cloud",()=>{const{canvas:e,ctx:n}=Jn(256,128);n.clearRect(0,0,256,128),n.fillStyle="#ffffff";const s=[[70,78,34],[110,62,42],[155,74,36],[92,88,30],[132,90,32]];for(const[a,o,l]of s)n.beginPath(),n.arc(a,o,l,0,Math.PI*2),n.fill();n.fillRect(30,86,196,26);const r=jn(e);return r.premultiplyAlpha=!0,r})}function Zh(i){return Qn(`glow:${i}`,()=>{const{canvas:e,ctx:n}=Jn(128,128),s=n.createRadialGradient(128/2,128/2,4,128/2,128/2,128/2);return s.addColorStop(0,i),s.addColorStop(.4,i+"88"),s.addColorStop(1,i+"00"),n.fillStyle=s,n.fillRect(0,0,128,128),jn(e)})}const Kh={coupe:{halfLen:2.24,width:1.52,floorY:.3,roofY:1.42,wheelX:.9,wheelFrontZ:1.42,wheelRearZ:-1.45,wheelR:.38},hatch:{halfLen:1.86,width:1.5,floorY:.3,roofY:1.5,wheelX:.86,wheelFrontZ:1.2,wheelRearZ:-1.22,wheelR:.36},muscle:{halfLen:2.48,width:1.78,floorY:.28,roofY:1.32,wheelX:.98,wheelFrontZ:1.6,wheelRearZ:-1.62,wheelR:.42},cruiser:{halfLen:2.34,width:1.62,floorY:.3,roofY:1.44,wheelX:.92,wheelFrontZ:1.5,wheelRearZ:-1.52,wheelR:.4},hover:{halfLen:2.2,width:1.66,floorY:.22,roofY:1.36,wheelX:.9,wheelFrontZ:1.4,wheelRearZ:-1.42,wheelR:0,exposedWheels:!0},roadster:{halfLen:2.2,width:1.5,floorY:.3,roofY:1.1,wheelX:.9,wheelFrontZ:1.4,wheelRearZ:-1.42,wheelR:.38,noCanopy:!0},formula:{halfLen:2.6,width:1.14,floorY:.22,roofY:.92,wheelX:1.02,wheelFrontZ:1.55,wheelRearZ:-1.6,wheelR:.42,exposedWheels:!0,noCanopy:!0}},Gx={tire:"street",rim:"star",spoiler:"wing",exhaust:"twin"};class Vx{root=new ge;wheelMesh;wheelAnchors;wheelMatrix=new ee;wheelQuat=new un;wheelEuler=new je;wheelPos=new A;wheelScale=new A(1,1,1);bodyMaterials=[];baseEmissive=[];wheelSpin=0;steerVisual=0;constructor(t){const{paint:e,body:n="coupe",themeAccent:s,parts:r}=t,a=Kh[n],o={...Gx,...r},l=Hx(e),c=Jh(n,a),h=new Tt(c,l.body);if(h.castShadow=!0,this.root.add(h),this.bodyMaterials.push(l.body),this.baseEmissive.push(l.body.emissiveIntensity),!a.noCanopy){const I=new Tt(jh(n,a),l.glass);I.castShadow=!0,this.root.add(I)}const u=new Tt(c.clone().scale(1.055,1.07,1.045),vn("car-outline",()=>new Oe({color:"#0a0412",side:Xe})));this.root.add(u);const d=new Tt(Wx(n,a,o),l.dark);d.castShadow=!0,this.root.add(d);const f=new Tt(Xx(n,a,o),l.accent);f.castShadow=!0,this.root.add(f);const p=Lt("car-headlight",{color:"#e8fbff",emissive:"#b8f4ff",emissiveIntensity:1.6,roughness:.2}),x=mt("car-headlight-geo",()=>zt(.46,.085,.12,.02)),g=a.width/1.52;for(const I of[-.52*g,.52*g]){const C=new Tt(x,p);C.position.set(I,.78,a.halfLen-.06),this.root.add(C)}const m=Lt(`car-tail-${e.emissive}`,{color:e.emissive,emissive:e.emissive,emissiveIntensity:1.8,roughness:.3}),v=new Tt(mt("car-tail-geo",()=>zt(1.58,.09,.1,.02)),m);v.position.set(0,.98,-a.halfLen+.03),this.root.add(v);const M=new Tt($x(a),l.dark);this.root.add(M);const S=new Tt(mt("car-helmet",()=>new Kn(.15,12,10)),Lt(`car-helmet-${e.accent}`,{color:e.accent,roughness:.35,emissive:e.accent,emissiveIntensity:.35}));S.position.set(-.3,a.roofY-.26,.12),this.root.add(S);const R=mt("car-exhaust",()=>{const I=new Ne(.085,.1,.24,10);return I.rotateX(Math.PI/2),I}),E=Lt("car-exhaust",{color:"#3a3a44",metalness:.85,roughness:.35}),P=n==="hover"?.36:.44,y=o.exhaust==="single"?[0]:o.exhaust==="quad"?[-.55,-.2,.2,.55]:[-.4,.4];for(const I of y){const C=new Tt(R,E);C.position.set(I,P,-a.halfLen-.01),this.root.add(C)}const T=new Tt(mt("car-underglow",()=>new Ae(3.4,6.2)),vn(`car-underglow-${e.accent}`,()=>new Oe({map:Zh(e.accent),transparent:!0,opacity:.4,blending:wi,depthWrite:!1})));if(T.rotation.x=-Math.PI/2,T.position.y=.07,this.root.add(T),this.wheelAnchors=[{x:-a.wheelX,z:a.wheelFrontZ},{x:a.wheelX,z:a.wheelFrontZ},{x:-a.wheelX*1.04,z:a.wheelRearZ},{x:a.wheelX*1.04,z:a.wheelRearZ}],n==="hover"){this.wheelMesh=null;const I=Lt(`hover-pad-${e.accent}`,{color:"#10131c",emissive:e.accent,emissiveIntensity:1.2,roughness:.3}),C=mt("hover-pad",()=>new Ne(.44,.52,.14,14));for(const W of this.wheelAnchors){const D=new Tt(C,I);D.position.set(W.x,.14,W.z),this.root.add(D)}const N=Lt("hover-fan",{color:e.accent,emissive:e.accent,emissiveIntensity:.8,transparent:!0,opacity:.5,blending:wi,depthWrite:!1,side:xe}),H=mt("hover-fan-geo",()=>new Ko(.36,14));for(const W of this.wheelAnchors){const D=new Tt(H,N);D.rotation.x=-Math.PI/2,D.position.set(W.x,.07,W.z),this.root.add(D)}}else this.wheelMesh=new Ee(qx(e,a.wheelR,o.tire,o.rim),l.wheel,4),this.wheelMesh.castShadow=!0,this.root.add(this.wheelMesh),this.updateWheelInstances()}updateVisual(t,e){this.wheelSpin+=t,this.steerVisual+=(e*.42-this.steerVisual)*.2,this.wheelMesh&&this.updateWheelInstances()}updateWheelInstances(){this.wheelAnchors.forEach((t,e)=>{const n=e<2;this.wheelEuler.set(this.wheelSpin,n?this.steerVisual:0,0,"YXZ"),this.wheelQuat.setFromEuler(this.wheelEuler),this.wheelPos.set(t.x,.38,t.z),this.wheelMatrix.compose(this.wheelPos,this.wheelQuat,this.wheelScale),this.wheelMesh.setMatrixAt(e,this.wheelMatrix)}),this.wheelMesh.instanceMatrix.needsUpdate=!0}setFlash(t,e){const n=.15+t*1.5+(e?.25:0);this.bodyMaterials.forEach((s,r)=>{s.emissiveIntensity=this.baseEmissive[r]+n-.15})}}function Hx(i){const t=new ec({color:i.body,roughness:.32,metalness:.55,clearcoat:.9,clearcoatRoughness:.22,emissive:i.emissive,emissiveIntensity:.15}),e=new Ce({color:i.accent,roughness:.3,metalness:.5,emissive:i.accent,emissiveIntensity:.55}),n=new Ce({color:"#16101f",roughness:.72,metalness:.25}),s=new ec({color:"#9ff4ff",roughness:.08,metalness:.4,transparent:!0,opacity:.55,emissive:"#2dfff3",emissiveIntensity:.2,clearcoat:1}),r=new Ce({vertexColors:!0,roughness:.55,metalness:.45});return{body:t,accent:e,dark:n,glass:s,wheel:r}}function Jh(i,t){const e=t.halfLen,n=t.roofY,s=t.floorY,r=new rn,a=i==="muscle"?.35:i==="formula"?-.2:.62,o=i==="muscle"?.72:i==="hover"?.6:i==="formula"?.45:.72;r.moveTo(-e,.52),i==="cruiser"?r.quadraticCurveTo(-e-.04,.9,-e+.24,1):(r.lineTo(-e-.04,.92),r.quadraticCurveTo(-e-.02,1.02,-e+.2,1.04)),r.lineTo(-e+.75,1.07),i==="hatch"?(r.lineTo(-.15,n-.06),r.lineTo(.3,n)):i==="muscle"?(r.lineTo(.05,n+.04),r.lineTo(.5,n+.02)):i==="formula"?(r.lineTo(-.4,1.18),r.lineTo(.1,.98),r.lineTo(.55,.8)):i==="roadster"?(r.lineTo(-.5,n+.02),r.lineTo(.25,n+.02)):(r.quadraticCurveTo(-1,n-.06,-.62,n-.02),r.lineTo(.12,n)),r.quadraticCurveTo(a,n-.06,a+.12,1.05),r.lineTo(1.4,.94),r.quadraticCurveTo(e-.35,.86,e-.1,o),r.lineTo(e,i==="formula"?.5:.6),r.lineTo(e,s+.06),r.lineTo(e*.52,s),r.lineTo(-e*.52,s),r.closePath();const l=new Rn(r,{depth:t.width,bevelEnabled:!0,bevelThickness:.1,bevelSize:.1,bevelSegments:2,steps:1,curveSegments:6});return l.translate(0,0,-t.width/2),l.rotateY(-Math.PI/2),l.computeVertexNormals(),l}function jh(i,t){const e=t.roofY,n=t.halfLen,s=new rn;s.moveTo(-n+.8,1.03),i==="hatch"?(s.lineTo(-.12,e-.05),s.lineTo(.28,e-.03)):(s.quadraticCurveTo(-.9,e-.08,-.55,e-.04),s.lineTo(.08,e-.02)),s.quadraticCurveTo(.45,e-.08,.56,1.04),s.lineTo(.2,1),s.lineTo(-n+1.2,.99),s.closePath();const r=new Rn(s,{depth:t.width-.24,bevelEnabled:!0,bevelThickness:.06,bevelSize:.06,bevelSegments:1,steps:1,curveSegments:6});return r.translate(0,0,-(t.width-.24)/2),r.rotateY(-Math.PI/2),r.computeVertexNormals(),r}function Wx(i,t,e){const n=[],s=(a,o,l,c)=>{a.translate(o,l,c),n.push(a)},r=t.halfLen;if(s(zt(1.9,.09,.5,.02),0,.27,r-.22),s(zt(1.8,.14,.4,.02),0,.3,-r+.16),s(zt(.16,.13,r*1.15,.02),-t.width/2-.02,.29,0),s(zt(.16,.13,r*1.15,.02),t.width/2+.02,.29,0),!t.exposedWheels)for(const a of[-t.wheelX,t.wheelX])for(const o of[t.wheelFrontZ,t.wheelRearZ])s(zt(.24,.7,1,.02),a*1.02,.52,o);return(e.spoiler==="wing"||e.spoiler==="bigwing")&&(s(zt(.1,.3,.18,.02),-.55,1.1,-r+.24),s(zt(.1,.3,.18,.02),.55,1.1,-r+.24),e.spoiler==="bigwing"&&(s(zt(.1,.24,.18,.02),-.55,1.32,-r+.24),s(zt(.1,.24,.18,.02),.55,1.32,-r+.24))),i==="formula"&&(s(zt(.24,.16,1.1,.02),0,.5,r+.2),s(zt(1.9,.07,.5,.02),0,.36,r+.32),s(zt(.05,.28,.42,.01),-.92,.36,r+.32),s(zt(.05,.28,.42,.01),.92,.36,r+.32)),s(zt(.05,.05,.16,.01),-t.width/2-.06,1,.52),s(zt(.05,.05,.16,.01),t.width/2+.06,1,.52),s(zt(1.15,.07,.07,.01),0,1.12,-.55),Vs(n,!1)}function Xx(i,t,e){const n=[],s=(a,o,l,c)=>{a.translate(o,l,c),n.push(a)},r=t.halfLen;return e.spoiler==="wing"?(s(zt(1.72,.07,.46,.02),0,1.26,-r+.22),s(zt(.05,.3,.52,.02),-.88,1.2,-r+.24),s(zt(.05,.3,.52,.02),.88,1.2,-r+.24)):e.spoiler==="bigwing"?(s(zt(1.8,.07,.52,.02),0,1.5,-r+.22),s(zt(1.66,.06,.3,.02),0,1.14,-r+.26),s(zt(.06,.62,.62,.02),-.92,1.22,-r+.22),s(zt(.06,.62,.62,.02),.92,1.22,-r+.22)):e.spoiler==="ducktail"&&s(zt(1.7,.12,.34,.03),0,1.16,-r+.14),s(zt(.05,.07,r*1,.01),-t.width/2-.04,.4,0),s(zt(.05,.07,r*1,.01),t.width/2+.04,.4,0),s(zt(.14,.1,.12,.02),-t.width/2-.1,1.06,.52),s(zt(.14,.1,.12,.02),t.width/2+.1,1.06,.52),s(zt(.22,.02,1.1,.005),0,.955,r*.62),i==="muscle"&&s(zt(.6,.14,.7,.03),0,1.1,r*.55),Vs(n,!1)}function $x(i){const t=[],e=(r,a,o,l)=>{r.translate(a,o,l),t.push(r)},n=i.roofY-.47;e(zt(.34,.5,.14,.02),-.3,n,-.28),e(zt(.34,.5,.14,.02),.3,n,-.28),e(zt(.34,.12,.3,.02),-.3,n-.23,-.12),e(zt(.34,.12,.3,.02),.3,n-.23,-.12);const s=new Tn(.13,.025,6,14);return s.rotateX(-1.1),e(s.toNonIndexed(),-.3,n+.05,.28),Vs(t,!1)}function qx(i,t,e,n){const s={street:{color:new Nt("#0d0d12"),width:.3,radius:t},slick:{color:new Nt("#14141c"),width:.34,radius:t},offroad:{color:new Nt("#2a2a22"),width:.36,radius:t*1.1},whitewall:{color:new Nt("#0d0d12"),width:.3,radius:t}}[e],r={star:{face:new Nt("#c8ccd8"),hub:new Nt(i.accent),spokes:5},tuner:{face:new Nt("#e8ecf4"),hub:new Nt("#d8b860"),spokes:7},aero:{face:new Nt("#22242c"),hub:new Nt(i.accent),spokes:3}}[n],a=s.radius,o=[],l=(p,x)=>{const g=p.attributes.position.count,m=new Float32Array(g*3);for(let v=0;v<g;v+=1)m[v*3]=x.r,m[v*3+1]=x.g,m[v*3+2]=x.b;p.setAttribute("color",new Ze(m,3)),o.push(p.toNonIndexed())},c=new Ne(a,a,s.width,22,1);if(c.rotateZ(Math.PI/2),l(c,s.color),e==="whitewall"){const p=new Tn(a*.82,.035,6,20);p.rotateY(Math.PI/2),l(p,new Nt("#f2f0e8"))}const h=new Ne(a*.62,a*.62,s.width+.015,14,1);h.rotateZ(Math.PI/2),l(h,r.face);const u=new Tn(a*.71,.045,8,18);u.rotateY(Math.PI/2),l(u,r.face);for(let p=0;p<r.spokes;p+=1){const x=new Pe(.06,a*1.05,.05);x.rotateX(p/r.spokes*Math.PI),x.translate(0,0,.13),l(x,r.face)}const d=new Ne(a*.18,a*.18,.34,10);d.rotateZ(Math.PI/2),l(d,r.hub);const f=new Tn(a*.87,.014,6,20);return f.rotateY(Math.PI/2),l(f,r.hub),Vs(o,!1)}const sl={accel:28,maxSpeed:42,boostSpeed:58,reverseSpeed:12,steerRate:2.4,grip:9.5,driftGrip:2.2,brakeForce:40,drag:.4,boostDrain:.35};class Fc{constructor(t,e,n,s,r={...sl}){this.track=t,this.tuning=r,this.index=e,this.isPlayer=s,this.paint=n,this.gridReset()}group=new ge;controls={throttle:0,steer:0,brake:!1,drift:!1,boost:!1};position=new A;heading=0;velocity=new A;speed=0;lateralSpeed=0;boost=.5;driftCharge=0;drifting=!1;driftTier=0;driftChain=0;driftScore=0;onMiniTurbo;onCollision;trackU=0;unwrappedProgress=0;lap=0;lapTime=0;bestLap=0;lastLap=0;finished=!1;onRoad=!0;collisionFlash=0;isPlayer;paint;index;radius=1.4;lastTurboTime=-10;prevTrackU=0;localOffset=new A;visualYaw=0;visual=null;attachVisual(t="#2dfff3",e,n){this.visual||(this.visual=new Vx({paint:this.paint,themeAccent:t,body:e??"coupe",parts:n}),this.group.add(this.visual.root))}gridReset(){const t=this.track.spawnGrid(this.index);this.position.copy(t.position),this.position.y=0,this.heading=t.heading,this.velocity.set(0,0,0),this.speed=0,this.lateralSpeed=0,this.boost=.55,this.driftCharge=0,this.drifting=!1,this.lap=0,this.lapTime=0,this.lastLap=0,this.bestLap=0,this.finished=!1,this.collisionFlash=0;const e=this.track.findClosestU(this.position);this.trackU=e.u,this.prevTrackU=e.u,this.unwrappedProgress=e.u-1,this.lap=Math.floor(this.unwrappedProgress),this.syncTransform(0)}resetProgress(){this.gridReset()}update(t,e){(!e||this.finished)&&(this.controls.throttle*=Math.max(0,1-t*4),this.controls.boost=!1,this.controls.drift=!1),this.applyControls(t),this.integrate(t),this.constrainToTrack(),this.updateProgress(t),this.syncTransform(t),this.collisionFlash=Math.max(0,this.collisionFlash-t*3)}applyControls(t){const e=this.tuning,n=new A(Math.sin(this.heading),0,Math.cos(this.heading)),s=new A(n.z,0,-n.x),r=this.velocity.dot(n);this.speed=this.velocity.length(),this.lateralSpeed=this.velocity.dot(s);const a=this.controls.boost&&this.boost>.02&&this.controls.throttle>.1;a&&(this.boost=Math.max(0,this.boost-e.boostDrain*t));let o=e.maxSpeed;if(a&&(o=e.boostSpeed),this.controls.throttle>0){const m=r<o?e.accel*this.controls.throttle:0;if(this.velocity.addScaledVector(n,m*t),r>o){const v=r-o;this.velocity.addScaledVector(n,-Math.min(v,20*t))}}else this.controls.throttle<0&&(r>1?this.velocity.addScaledVector(n,-e.brakeForce*t):this.velocity.addScaledVector(n,e.reverseSpeed*this.controls.throttle*t));this.controls.brake&&r>0&&this.velocity.addScaledVector(n,-e.brakeForce*t);const l=ke.clamp(Math.abs(r)/8,.15,1),c=r<-.5?-1:1,h=this.drifting?1.35:1;this.heading-=this.controls.steer*e.steerRate*l*c*h*t;const u=this.controls.drift&&Math.abs(r)>12?e.driftGrip:e.grip,d=Math.exp(-u*t);this.velocity.addScaledVector(s,-this.lateralSpeed*(1-d));const f=this.drifting;if(this.drifting=this.controls.drift&&Math.abs(r)>14&&Math.abs(this.lateralSpeed)>4&&Math.abs(this.controls.steer)>.15,this.drifting)this.driftCharge=Math.min(1,this.driftCharge+t*.35),this.boost=Math.min(1,this.boost+t*.22),this.velocity.addScaledVector(s,this.controls.steer*6*t),!f&&this.isPlayer&&this.velocity.multiplyScalar(1.01);else{if(f&&this.driftCharge>=.5){const m=this.driftCharge>=.9?2:1;this.velocity.addScaledVector(n,m===2?7.5:4.5);const v=this.lapTime-this.lastTurboTime;this.driftChain=v<4&&this.lastTurboTime>=0?Math.min(this.driftChain+1,9):1,this.lastTurboTime=this.lapTime,this.driftScore+=m*150*this.driftChain,this.onMiniTurbo?.(m,this.driftChain,this)}this.driftCharge=Math.max(0,this.driftCharge-t*.15),this.driftCharge===0&&(this.driftTier=0)}this.driftTier=this.drifting?this.driftCharge>=.9?2:this.driftCharge>=.5?1:0:0;const p=Math.exp(-e.drag*t);this.velocity.x*=p,this.velocity.z*=p;const x=a?e.boostSpeed:e.maxSpeed,g=Math.hypot(this.velocity.x,this.velocity.z);if(g>x+2){const m=(x+2)/g;this.velocity.x*=m,this.velocity.z*=m}}integrate(t){this.position.addScaledVector(this.velocity,t),this.position.y=0}constrainToTrack(){const{u:t,lateral:e}=this.track.findClosestU(this.position,this.trackU);this.trackU=t;const n=this.track.roadHalfWidth+2.5;if(Math.abs(e)>n){this.onRoad=!1;const s=this.track.getSample(Math.floor(t*400)),r=ke.clamp(e,-n,n);this.position.copy(s.position).addScaledVector(s.right,r);const a=this.velocity.length();a>8?(this.velocity.multiplyScalar(.72),this.collisionFlash=1,this.onCollision?.(Math.min(1,a/30),this)):this.velocity.multiplyScalar(.85)}else this.onRoad=Math.abs(e)<=this.track.roadHalfWidth,this.onRoad||this.velocity.multiplyScalar(Math.exp(-1.8*.016));for(const s of this.track.getBoostPadUs()){let r=Math.abs(t-s);if(r>.5&&(r=1-r),r<.008&&this.onRoad){this.boost=Math.min(1,this.boost+.45);const a=new A(Math.sin(this.heading),0,Math.cos(this.heading));this.velocity.addScaledVector(a,8);break}}}updateProgress(t){this.lapTime+=t;let e=this.trackU-this.prevTrackU;e>.5&&(e-=1),e<-.5&&(e+=1),this.unwrappedProgress+=e,this.prevTrackU=this.trackU;const n=Math.floor(this.unwrappedProgress);n>this.lap&&(this.lap>=0&&(this.lastLap=this.lapTime,(this.bestLap===0||this.lastLap<this.bestLap)&&(this.bestLap=this.lastLap)),this.lap=n,this.lapTime=0),this.unwrappedProgress<this.lap&&(this.unwrappedProgress=this.lap)}syncTransform(t){const e=this.heading,n=Math.min(1,this.speed/30),s=e+(this.drifting?-this.controls.steer*.35:0),r=t>0?1-Math.exp(-10*t):1;this.visualYaw+=Yx(this.visualYaw,s)*r,this.group.position.copy(this.position),this.group.rotation.y=this.visualYaw;const a=ke.clamp(this.controls.steer*n*(this.drifting?.2:.1),-.2,.2);this.group.rotation.z=ke.lerp(this.group.rotation.z,a,t>0?.15:1),this.visual?.updateVisual(this.speed*t*2.5,this.controls.steer),this.visual?.setFlash(this.collisionFlash,this.drifting),this.localOffset}resolveCarCollision(t){const e=this.position.x-t.position.x,n=this.position.z-t.position.z,s=Math.hypot(e,n),r=this.radius+t.radius;if(s<=.001||s>=r)return;const a=e/s,o=n/s,l=r-s;this.position.x+=a*l*.5,this.position.z+=o*l*.5,t.position.x-=a*l*.5,t.position.z-=o*l*.5;const c=new A(this.velocity.x-t.velocity.x,0,this.velocity.z-t.velocity.z),h=c.x*a+c.z*o;if(h<0){const u=-h*.55;this.velocity.x+=a*u,this.velocity.z+=o*u,t.velocity.x-=a*u,t.velocity.z-=o*u,this.collisionFlash=Math.max(this.collisionFlash,.8),t.collisionFlash=Math.max(t.collisionFlash,.8),this.onCollision?.(Math.min(1,u/9),this),t.onCollision?.(Math.min(1,u/9),t)}}setTuning(t){this.tuning=t}getForward(){return new A(Math.sin(this.heading),0,Math.cos(this.heading))}}function Yx(i,t){let e=(t-i)%(Math.PI*2);return e>Math.PI&&(e-=Math.PI*2),e<-Math.PI&&(e+=Math.PI*2),e}function Ra(i){return{fog:"#2a1048",fogDensity:.0045,accent:"#ff2d95",skyLight:"#ff2d95",groundBounce:"#12041f",keyColor:"#fff0ff",keyIntensity:2.2,sky:{bottom:"#1f0a38",mid:"#8c1f72",top:"#140a3c",kind:"gradient"},landmark:"arch",ground:{base:"#12041f",pattern:"grid",patternColor:"#2dfff3"},roadBase:"#12041f",roadMark:"rgba(255, 245, 180, 0.75)",edgeA:"#2dfff3",edgeB:"#ff2d95",tree:"palm",building:"city",...i}}const hn=[{id:"neon-loop",nameZh:"霓虹环道",nameEn:"NEON LOOP",blurb:"都市招牌密度拉满，发卡与长直交替",styleLabelZh:"蒸汽波",controlPoints:[[0,-90],[45,-88],[70,-70],[78,-30],[70,0],[85,30],[80,70],[50,95],[0,100],[-45,92],[-75,70],[-70,35],[-48,14],[-66,-8],[-85,-45],[-75,-80],[-45,-92]],roadHalfWidth:9,theme:Ra({style:"vapor"}),cupIndex:0,difficulty:1},{id:"sunset-pier",nameZh:"落日栈桥",nameEn:"SUNSET PIER",blurb:"暖紫黄昏大弧线，高速漂移刷圈首选",styleLabelZh:"蒸汽波",controlPoints:[[0,-105],[55,-105],[95,-55],[100,0],[85,50],[45,95],[0,110],[-55,95],[-95,50],[-100,-10],[-80,-60],[-45,-105]],roadHalfWidth:10,theme:Ra({style:"pier",fog:"#6b2a4a",accent:"#ffb347",skyLight:"#ff6ec7",keyColor:"#ffd9c8",keyIntensity:2.4,sky:{bottom:"#3b1548",mid:"#ff6ec7",top:"#2a1860",kind:"gradient"},landmark:"sun",ground:{base:"#1a0a28",pattern:"grid",patternColor:"#ffe600"},roadBase:"#1a0a28",edgeA:"#ffe600",edgeB:"#ff2d95"}),cupIndex:1,difficulty:2},{id:"void-grid",nameZh:"虚空网格",nameEn:"VOID GRID",blurb:"深空几何急弯链，对比最强",styleLabelZh:"蒸汽波",controlPoints:[[0,-84],[40,-84],[65,-45],[70,0],[58,45],[20,70],[-15,68],[-45,42],[-65,10],[-55,-25],[-45,-55],[-48,-70],[-38,-84]],roadHalfWidth:8,theme:Ra({style:"void",fog:"#12082a",fogDensity:.005,accent:"#2dfff3",skyLight:"#2dfff3",sky:{bottom:"#0a0620",mid:"#2b1460",top:"#070414",kind:"stars"},landmark:"tower",ground:{base:"#0a0620",pattern:"grid",patternColor:"#b84dff"},roadBase:"#0a0620",edgeA:"#2dfff3",edgeB:"#b84dff",tree:"none"}),cupIndex:2,difficulty:3},{id:"pop-burst",nameZh:"波普爆点",nameEn:"POP BURST",blurb:"漫画点阵都市，撞色与描边的狂欢",styleLabelZh:"波普",controlPoints:[[-82,-72],[-65,-88],[-20,-88],[20,-88],[50,-88],[68,-74],[85,-55],[70,-25],[95,5],[75,40],[90,75],[45,95],[5,70],[-30,95],[-70,80],[-60,40],[-90,10],[-65,-20],[-90,-55]],roadHalfWidth:9,theme:{style:"pop",fog:"#f5e9d0",fogDensity:.0032,accent:"#ef3340",skyLight:"#fff4d6",groundBounce:"#e8b64c",keyColor:"#ffffff",keyIntensity:2.6,sky:{bottom:"#ffe8b0",mid:"#ff8c5a",top:"#3a86ff",kind:"sunburst"},landmark:"comic-sun",ground:{base:"#f7ead2",pattern:"dots",patternColor:"#ef3340"},roadBase:"#4a4a52",roadMark:"#ffffff",edgeA:"#ef3340",edgeB:"#3a86ff",tree:"pop-flower",building:"pop-diner"},cupIndex:3,difficulty:3},{id:"monet-lily",nameZh:"睡莲水径",nameEn:"LILY PATH",blurb:"吉维尼花园的柔光水色，笔触之间漂移",styleLabelZh:"莫奈油画",controlPoints:[[0,-100],[45,-100],[95,-70],[105,-20],[70,15],[95,55],[55,95],[0,115],[-50,100],[-90,60],[-65,25],[-100,-15],[-85,-65],[-40,-100]],roadHalfWidth:10,theme:{style:"monet",fog:"#e8d8e0",fogDensity:.0042,accent:"#7ea6c9",skyLight:"#ffe9f0",groundBounce:"#9db89a",keyColor:"#fff3e0",keyIntensity:2.1,sky:{bottom:"#f5c6d6",mid:"#cdb4de",top:"#a3c4e4",kind:"strokes"},landmark:"lily-bridge",ground:{base:"#7ea6c9",pattern:"water",patternColor:"#9fc4dd"},roadBase:"#b9a58c",roadMark:"#f5ead2",edgeA:"#a3c4e4",edgeB:"#e8a0bf",tree:"willow",building:"cottage"},cupIndex:4,difficulty:2},{id:"red-october",nameZh:"赤色十月",nameEn:"RED OCTOBER",blurb:"构成主义工业直道，红色楔形切风而过",styleLabelZh:"苏联海报",controlPoints:[[0,-120],[70,-120],[110,-80],[110,-20],[110,30],[110,90],[55,120],[-10,120],[-10,60],[-70,60],[-110,20],[-110,-50],[-60,-120]],roadHalfWidth:11,theme:{style:"soviet",fog:"#e0d5b8",fogDensity:.003,accent:"#d52b1e",skyLight:"#f5e9c8",groundBounce:"#8a7a55",keyColor:"#fff2d9",keyIntensity:2.5,sky:{bottom:"#f2e6c8",mid:"#e0a83c",top:"#c8281a",kind:"sunburst"},landmark:"red-star",ground:{base:"#c9b98a",pattern:"field",patternColor:"#d52b1e"},roadBase:"#3d3a34",roadMark:"#f5e9c8",edgeA:"#d52b1e",edgeB:"#f5e9c8",tree:"pine",building:"soviet-block"},cupIndex:5,difficulty:4},{id:"sakura-dash",nameZh:"樱花疾驰",nameEn:"SAKURA DASH",blurb:"黄昏赛道连续发卡，花瓣与电线杆飞掠",styleLabelZh:"动漫",controlPoints:[[0,-88],[40,-88],[62,-50],[40,-25],[70,0],[62,35],[30,45],[48,70],[52,88],[8,94],[-40,82],[-30,45],[-65,35],[-80,0],[-50,-30],[-75,-60],[-40,-88]],roadHalfWidth:8.5,theme:{style:"anime",fog:"#e8a0a8",fogDensity:.0038,accent:"#ff7eb6",skyLight:"#ffd9a0",groundBounce:"#6a5a7a",keyColor:"#ffe8d0",keyIntensity:2.3,sky:{bottom:"#ff9a6c",mid:"#ff7eb6",top:"#7a5aa8",kind:"clouds"},landmark:"fuji",ground:{base:"#5a7a4a",pattern:"plaza",patternColor:"#c9b8a8"},roadBase:"#4a4550",roadMark:"#f5f0e8",edgeA:"#ff7eb6",edgeB:"#7ec8e8",tree:"sakura",building:"townhouse"},cupIndex:6,difficulty:5},{id:"neon-rain",nameZh:"赛博雨夜",nameEn:"NEON RAIN",blurb:"雨幕霓虹都市：大直道冲爽，双发卡考技术",styleLabelZh:"赛博雨夜",controlPoints:[[0,-100],[90,-100],[130,-60],[118,-12],[68,8],[96,48],[76,92],[10,110],[-55,96],[-96,56],[-80,12],[-110,-26],[-96,-70],[-45,-105]],roadHalfWidth:9,theme:{style:"rain",fog:"#0c0a1e",fogDensity:.0052,accent:"#00e5ff",skyLight:"#3d4d7a",groundBounce:"#0a0a14",keyColor:"#c8d8ff",keyIntensity:1.9,sky:{bottom:"#12102a",mid:"#1d1b3f",top:"#06060f",kind:"rain-clouds"},landmark:"holo-ring",ground:{base:"#0b0b16",pattern:"wet",patternColor:"#2de2ff"},roadBase:"#141420",roadMark:"#7ef2ff",edgeA:"#2de2ff",edgeB:"#ff2ea6",tree:"none",building:"rain-tower",rain:!0},cupIndex:7,difficulty:4},{id:"ink-wash",nameZh:"水墨山径",nameEn:"INK WASH",blurb:"宣纸留白与墨色远山，大弧线漂移如运笔",styleLabelZh:"水墨",controlPoints:[[0,-97],[55,-97],[105,-55],[120,0],[100,60],[45,100],[-20,105],[-75,70],[-95,15],[-85,-40],[-45,-97]],roadHalfWidth:10,theme:{style:"ink",fog:"#e9e6de",fogDensity:.0046,accent:"#2b2b30",skyLight:"#f7f4ec",groundBounce:"#8f8a80",keyColor:"#fffdf6",keyIntensity:2,sky:{bottom:"#efece2",mid:"#c9c4b8",top:"#a9a69c",kind:"ink"},landmark:"ink-bridge",ground:{base:"#eae6da",pattern:"paper",patternColor:"#2b2b30"},roadBase:"#8d8578",roadMark:"#f7f4ea",edgeA:"#2b2b30",edgeB:"#b03a2e",tree:"bamboo",building:"ink-cottage"},cupIndex:8,difficulty:2},{id:"pixel-rush",nameZh:"像素狂飙",nameEn:"PIXEL RUSH",blurb:"8-bit 色块世界，双大直道+直角弯群",styleLabelZh:"像素",controlPoints:[[0,-90],[95,-90],[125,-40],[125,40],[95,90],[0,95],[-75,95],[-115,45],[-115,-45],[-75,-90]],roadHalfWidth:9,theme:{style:"pixel",fog:"#2a2f4e",fogDensity:.0036,accent:"#ffd23f",skyLight:"#8fa8ff",groundBounce:"#2a2f4e",keyColor:"#ffffff",keyIntensity:2.2,sky:{bottom:"#3a86ff",mid:"#8f5cff",top:"#ff5c8a",kind:"pixel"},landmark:"pixel-star",ground:{base:"#3b4166",pattern:"checker",patternColor:"#565f92"},roadBase:"#2e3350",roadMark:"#ffd23f",edgeA:"#ffd23f",edgeB:"#00e0a4",tree:"pixel-tree",building:"pixel-block"},cupIndex:9,difficulty:3},{id:"minimal-clean",nameZh:"极简白域",nameEn:"MINIMAL CLEAN",blurb:"留白与光影，一条超长直道三个大弯",styleLabelZh:"极简",controlPoints:[[0,-110],[110,-110],[150,-40],[140,40],[80,100],[0,115],[-80,100],[-140,40],[-150,-40],[-110,-110]],roadHalfWidth:11,theme:{style:"minimal",fog:"#eceff2",fogDensity:.0034,accent:"#ff6a3d",skyLight:"#ffffff",groundBounce:"#c9ced4",keyColor:"#ffffff",keyIntensity:2.4,sky:{bottom:"#f4f6f8",mid:"#dde3ea",top:"#c3cbd6",kind:"plain"},landmark:"clean-ring",ground:{base:"#f2f4f6",pattern:"white",patternColor:"#d8dde2"},roadBase:"#33373d",roadMark:"#ffffff",edgeA:"#ff6a3d",edgeB:"#22262b",tree:"minimal-orb",building:"white-slab"},cupIndex:10,difficulty:3}],Zx=hn.map(i=>i.id);function es(i){return hn.find(t=>t.id===i)??hn[0]}const He=2.5;function Kx(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Jx(i,t){const e=new ge;if(e.name="light-posts",t.length===0)return e;const n=mt("lamp-pole",()=>{const l=new Pe(.16,1,.16);return l.translate(0,.5,0),l}),s=mt("lamp-head",()=>new Pe(.55,.7,.55)),r=t.filter((l,c)=>c%2===0),a=t.filter((l,c)=>c%2===1),o=[{color:i.edgeB,list:r},{color:i.edgeA,list:a}];for(const l of o){if(l.list.length===0)continue;const c=Lt(`lamp-pole-${i.style}`,{color:"#241a30",roughness:.7,metalness:.3}),h=Lt(`lamp-${i.style}-${l.color}`,{color:l.color,emissive:l.color,emissiveIntensity:1.5,roughness:.4}),u=new Ee(n,c,l.list.length),d=new Ee(s,h,l.list.length);Ke(u,l.list.map(f=>({position:f.position,rotationY:f.rotationY,scale:new A(1,1.7,1).multiplyScalar(f.scale??1)}))),Ke(d,l.list.map(f=>({position:f.position.clone().setY(1.78),rotationY:f.rotationY,scale:f.scale??1}))),u.castShadow=!1,e.add(u,d)}return e}function jx(i,t){const e=new ge;if(e.name="billboards",i.length===0)return e;const n=Lt(`bb-frame-${t}`,{color:"#241833",roughness:.7,metalness:.25}),s=mt("bb-frame",()=>zt(1,1,.35,.06)),r=new Map;for(const a of i){const o=`${t}:${a.text}:${a.color}`;r.has(o)||r.set(o,{texture:Yh(a.text,a.color,t),specs:[]}),r.get(o).specs.push(a)}for(const{texture:a,specs:o}of r.values()){const l=new Ee(s,n,o.length*2),c=o.flatMap(x=>{const g=x.height;return[.8,1.6].map(m=>({position:x.position.clone().setY(g*m/2-.05),rotationY:x.rotationY,scale:new A(.35,g*m,.5)}))});Ke(l,c),e.add(l);const h=vn(`bb-panel-${t}-${a.uuid}`,()=>new Ce({map:a,roughness:.6,emissiveMap:a,emissive:"#ffffff",emissiveIntensity:t==="monet"?.08:.4,roughnessMap:null})),u=mt("bb-panel",()=>new Ae(1,1)),d=new Ee(u,h,o.length);Ke(d,o.map(x=>({position:x.position.clone().setY(x.height-.2),rotationY:x.rotationY,scale:new A(x.width,x.width/2,1)}))),d.castShadow=!0,e.add(d);const f=Lt(`bb-back-${t}`,{color:"#1a1024",roughness:.8}),p=new Ee(u,f,o.length);Ke(p,o.map(x=>({position:x.position.clone().setY(x.height-.2).add(new A(Math.sin(x.rotationY),0,Math.cos(x.rotationY)).multiplyScalar(-.19)),rotationY:x.rotationY+Math.PI,scale:new A(x.width,x.width/2,1)}))),e.add(p)}return e}function Qx(i,t){const e=()=>{const a=document.createElement("canvas");a.width=256,a.height=512;const o=a.getContext("2d");if(i==="city"){o.fillStyle="#150a26",o.fillRect(0,0,256,512);for(let c=10;c<502;c+=26)for(let h=10;h<246;h+=24){const u=(h*7+c*13)%5<3;o.fillStyle=u?"rgba(45, 255, 243, 0.85)":"rgba(120, 60, 200, 0.35)",o.fillRect(h,c,14,16)}}else if(i==="pop-diner"){o.fillStyle="#fff6e0",o.fillRect(0,0,256,512),o.fillStyle=t.edgeA,o.fillRect(0,0,256,40),o.fillStyle=t.edgeB,o.fillRect(0,40,256,14);for(let c=80;c<482;c+=90)for(let h=16;h<216;h+=70)o.fillStyle="#111111",o.fillRect(h,c,54,54),o.fillStyle="#8fd6ff",o.fillRect(h+6,c+6,42,42);o.fillStyle="#111111",o.fillRect(0,486,256,26)}else if(i==="rain-tower"){o.fillStyle="#10131f",o.fillRect(0,0,256,512);for(let c=8;c<504;c+=22)for(let h=10;h<246;h+=26){const u=(h*5+c*11)%7<2;o.fillStyle=u?"rgba(45, 226, 255, 0.75)":"rgba(255, 46, 166, 0.28)",o.fillRect(h,c,16,12)}o.fillStyle="#2de2ff",o.globalAlpha=.85,o.fillRect(0,153.6,256,12),o.fillStyle="#ff2ea6",o.fillRect(0,317.44,256,12),o.globalAlpha=1}else if(i==="ink-cottage"){o.fillStyle="#f0ece0",o.fillRect(0,0,256,512),o.fillStyle="#3a3833",o.fillRect(0,0,256,18),o.fillRect(0,492,256,20),o.fillRect(0,266.24,256,10);for(let h=40;h<462;h+=110)for(let u=28;u<206;u+=96)o.fillStyle="#1d1c1a",o.fillRect(u,h,44,58),o.fillStyle="rgba(240, 236, 224, 0.55)",o.fillRect(u+5,h+5,34,48);const c=Kx(55);for(let h=0;h<40;h+=1)o.globalAlpha=.06+c()*.08,o.fillStyle="#5c564d",o.fillRect(c()*256,c()*512,26,8);o.globalAlpha=1}else if(i==="pixel-block"){o.fillStyle="#2e3350",o.fillRect(0,0,256,512);for(let c=16;c<496;c+=32)for(let h=16;h<240;h+=32){const u=(h/16+c/16)%3;o.fillStyle=u===0?"#ffd23f":u===1?"#00e0a4":"#4a5180",o.fillRect(h,c,24,24)}}else if(i==="white-slab"){o.fillStyle="#eef1f4",o.fillRect(0,0,256,512),o.fillStyle="#d8dde2";for(let c=24;c<512;c+=48)o.fillRect(0,c,256,3);o.fillStyle="#ff6a3d",o.fillRect(30.72,204.8,35.84,112.64),o.fillStyle="#22262b",o.fillRect(0,0,256,10)}else if(i==="cottage"){o.fillStyle="#d8c8b0",o.fillRect(0,0,256,512);for(let c=0;c<200;c+=1)o.fillStyle=`rgba(${120+c%5*20}, ${100+c%3*25}, 90, 0.12)`,o.fillRect(c*37%256,c*91%512,30,10);for(let c=60;c<472;c+=110)for(let h=24;h<216;h+=90)o.fillStyle="#5a4a3a",o.fillRect(h,c,46,64),o.fillStyle="rgba(255, 240, 200, 0.75)",o.fillRect(h+6,c+8,34,50)}else if(i==="soviet-block"){o.fillStyle="#cfc4a4",o.fillRect(0,0,256,512);for(let c=18;c<494;c+=34)for(let h=18;h<238;h+=40)o.fillStyle=(h+c)%3===0?"rgba(250, 245, 225, 0.9)":"rgba(60, 60, 58, 0.85)",o.fillRect(h,c,26,20);o.fillStyle=t.accent,o.fillRect(0,215.04,256,34),o.fillStyle="#f2e6c8",o.font="bold 26px sans-serif",o.textAlign="center",o.fillText("ВПЕРЁД",128,240.04)}else{o.fillStyle="#e8e0d8",o.fillRect(0,0,256,512);for(let c=14;c<498;c+=48)for(let h=14;h<236;h+=44)o.fillStyle="rgba(70, 90, 110, 0.9)",o.fillRect(h,c,32,30),o.fillStyle="rgba(255, 230, 160, 0.55)",o.fillRect(h+4,c+4,24,22);o.fillStyle="#8a5040",o.fillRect(0,0,256,16)}const l=new ls(a);return l.colorSpace=Re,l.wrapS=Ti,l.wrapT=Ti,l.anisotropy=4,l};return vn(`facade-tex-${i}`,()=>{const s=new Oe;return s.userData.texture=e(),s}).userData.texture}function tv(i,t,e){const n=new ge;if(n.name="buildings",i==="none"||e.length===0)return n;const s=Qx(i,t),r=Lt(`building-${i}`,{map:s,roughness:i==="city"?.5:.85,metalness:i==="city"?.3:.05,emissive:i==="city"?"#3a1f66":"#000000",emissiveIntensity:i==="city"?.35:0}),a=mt("building-box",()=>zt(1,1,1,.05)),o=Lt(`roof-${i}`,{color:"#1c1228",roughness:.85}),l=mt("building-roof",()=>zt(1.06,.18,1.06,.04)),c=e.filter((d,f)=>f%2===0),h=e.filter((d,f)=>f%2===1),u=(d,f,p)=>{if(d.length===0)return;const x=new Ee(a,r,d.length);Ke(x,d.map(m=>({position:m.position.clone().setY(f/2),rotationY:m.rotationY,scale:new A(p*(m.scale??1),f,p*(m.scale??1))}))),x.castShadow=!0,x.receiveShadow=!0;const g=new Ee(l,o,d.length);Ke(g,d.map(m=>({position:m.position.clone().setY(f+.08),rotationY:m.rotationY,scale:new A(p*(m.scale??1),1,p*(m.scale??1))}))),n.add(x,g)};switch(i){case"city":u(c,16,7),u(h,9,6);break;case"pop-diner":u(c,10,9),u(h,6,7);break;case"cottage":u(c,6,8),u(h,4.5,6.5);break;case"soviet-block":u(c,18,9),u(h,12,8);break;case"townhouse":u(c,7,7),u(h,5,5.5);break;case"rain-tower":u(c,22,8),u(h,13,6.5);break;case"ink-cottage":u(c,5.5,8),u(h,4,6);break;case"pixel-block":u(c,9,7),u(h,6,6);break;case"white-slab":u(c,12,9),u(h,7,7);break}return n}function Pa(i,t){const e=new ge;if(e.name=`landmark-${i}`,i==="arch"||i==="tower"||i==="sun"){if(i==="arch"){const n=Lt("landmark-arch",{color:t.edgeB,emissive:t.edgeB,emissiveIntensity:1.4,roughness:.3});for(const r of[-1,1]){const a=new Tt(mt("arch-pillar",()=>zt(1.5,16,1.5,.08)),n);a.position.set(r*10,8,0),e.add(a)}const s=new Tt(mt("arch-beam",()=>zt(22,1.6,1.6,.08)),n);s.position.y=16,e.add(s)}else if(i==="tower"){const n=Lt("landmark-tower",{color:t.accent,emissive:t.accent,emissiveIntensity:.8,roughness:.35,metalness:.5}),s=new Tt(mt("tower-shaft",()=>new Ne(1.2,2.4,48,10)),n);s.position.y=24,e.add(s);const r=new Tt(mt("tower-ring",()=>new Tn(6,.6,10,28)),n);r.rotation.x=Math.PI/2,r.position.y=36,e.add(r);const a=r.clone();a.position.y=28,a.scale.setScalar(.7),e.add(a)}return e}if(i==="comic-sun"){const n=Lt("comic-sun",{color:"#ffd23f",emissive:"#ffb347",emissiveIntensity:.55,roughness:.5}),s=new Tt(mt("comic-sun-core",()=>new Kn(16,20,14)),n);s.position.y=26,e.add(s);const r=mt("comic-ray",()=>new ts(2.4,9,4)),a=Lt("comic-ray",{color:"#ef3340",emissive:"#ef3340",emissiveIntensity:.3,roughness:.55});for(let o=0;o<12;o+=1){const l=o/12*Math.PI*2,c=new Tt(r,a),h=22;c.position.set(Math.cos(l)*h,26+Math.sin(l)*h*.8,0),c.lookAt(0,26,0),c.rotateX(Math.PI/2),e.add(c)}return e}if(i==="lily-bridge"){const n=Lt("lily-bridge",{color:"#4f7d5c",roughness:.7}),s=Lt("lily-rail",{color:"#3d6249",roughness:.7}),r=new Tt(mt("lily-arc",()=>{const a=new rn;return a.moveTo(-14,0),a.quadraticCurveTo(0,7.5,14,0),a.lineTo(14,1.1),a.quadraticCurveTo(0,8.6,-14,1.1),a.closePath(),new Rn(a,{depth:2.2,bevelEnabled:!1})}),n);r.position.y=6.4,e.add(r);for(const a of[-1,1]){const o=new Tt(mt("lily-rail",()=>{const l=new rn;return l.moveTo(-13.4,0),l.quadraticCurveTo(0,7.4,13.4,0),l.lineTo(13.4,.25),l.quadraticCurveTo(0,7.65,-13.4,.25),l.closePath(),new Rn(l,{depth:.22,bevelEnabled:!1})}),s);o.position.set(0,12.4,a*1.4),e.add(o);for(let l=-4;l<=4;l+=1){const c=new Tt(mt("lily-post",()=>new Pe(.22,1.5,.22)),s),h=l/5,u=h*12,d=Math.cos(h*Math.PI/2)**2*5.6;c.position.set(u,11.6+d-5,a*1.4),e.add(c)}}return e}if(i==="holo-ring"){const n=Lt("holo-ring",{color:"#0d2436",emissive:t.edgeA,emissiveIntensity:.9,roughness:.3,metalness:.5,transparent:!0,opacity:.82,side:xe}),s=new Tt(mt("holo-ring-geo",()=>new Tn(34,2.2,10,42)),n);s.position.y=46,e.add(s);const r=new Tt(mt("holo-ring-geo2",()=>new Tn(24,1.2,8,36)),n);r.position.y=46,r.rotation.x=Math.PI/3,e.add(r);const a=Lt("holo-shard",{color:"#ff2ea6",emissive:"#ff2ea6",emissiveIntensity:.7,roughness:.4}),o=mt("holo-shard-geo",()=>new Pe(5,5,.4));for(let l=0;l<8;l+=1){const c=l/8*Math.PI*2,h=new Tt(o,a);h.position.set(Math.cos(c)*34,46+Math.sin(c)*34,0),h.rotation.z=c+Math.PI/2,e.add(h)}return e}if(i==="ink-bridge"){const n=Lt("ink-beam",{color:"#2b2b30",roughness:.7}),s=Lt("ink-paper",{color:"#f0ece0",roughness:.85}),r=Lt("ink-lantern",{color:"#b03a2e",emissive:"#b03a2e",emissiveIntensity:.25,roughness:.6}),a=new Tt(mt("ink-beam-geo",()=>zt(30,2.4,3,.12)),n);a.position.y=17,e.add(a);const o=new Tt(mt("ink-roof-geo",()=>{const c=new rn;return c.moveTo(-17,0),c.quadraticCurveTo(-14,3.2,-9,3.6),c.lineTo(9,3.6),c.quadraticCurveTo(14,3.2,17,0),c.lineTo(17,.9),c.quadraticCurveTo(13,4.3,9,4.7),c.lineTo(-9,4.7),c.quadraticCurveTo(-13,4.3,-17,.9),c.closePath(),new Rn(c,{depth:4.2,bevelEnabled:!1})}),s);o.position.y=18.2,o.position.z=-2.1,e.add(o);for(const c of[-1,1]){const h=new Tt(mt("ink-post-geo",()=>zt(1.1,17,1.1,.08)),n);h.position.set(c*12,8.5,0),e.add(h)}const l=new Tt(mt("ink-lantern-geo",()=>new Kn(1.5,10,8)),r);return l.position.y=14.6,e.add(l),e}if(i==="pixel-star"){const n=Lt("pixel-star",{color:"#ffd23f",emissive:"#ffd23f",emissiveIntensity:.45,roughness:.6}),s=Lt("pixel-plinth",{color:"#2e3350",roughness:.85});for(let a=0;a<3;a+=1){const o=16-a*4,l=new Tt(mt(`pixel-plinth-${a}`,()=>zt(o,4,o,.1)),s);l.position.y=2+a*4,e.add(l)}const r=new Tt(mt("pixel-star-geo",()=>Oc(9,4)),n);return r.position.y=22,e.add(r),e}if(i==="clean-ring"){const n=Lt("clean-ring",{color:"#ffffff",roughness:.3,metalness:.1}),s=new Tt(mt("clean-ring-geo",()=>new Tn(30,.9,8,48)),n);s.position.y=40,s.rotation.x=Math.PI/2,e.add(s);const r=Lt("clean-slab",{color:"#ff6a3d",roughness:.5}),a=new Tt(mt("clean-slab-geo",()=>zt(6,34,1.4,.08)),r);return a.position.y=17,e.add(a),e}if(i==="red-star"){const n=Lt("soviet-red",{color:"#d52b1e",emissive:"#d52b1e",emissiveIntensity:.4,roughness:.5}),s=Lt("soviet-gold",{color:"#e8b64c",emissive:"#e8b64c",emissiveIntensity:.3,roughness:.45}),r=new Tt(mt("red-star",()=>Oc(7,3)),n);r.position.y=34,e.add(r);const a=new Tt(mt("soviet-pylon",()=>zt(2.2,30,2.2,.1)),s);return a.position.y=15,e.add(a),e}if(i==="fuji"){const n=Lt("fuji",{color:"#5a5480",roughness:.95,flatShading:!0}),s=new Tt(mt("fuji-cone",()=>new ts(90,46,8,1)),n);s.position.y=22,e.add(s);const r=Lt("fuji-snow",{color:"#fff0f4",roughness:.9,flatShading:!0}),a=new Tt(mt("fuji-snow",()=>new ts(34,15,8,1)),r);return a.position.y=37.4,e.add(a),e}return e}function Oc(i,t){const e=new rn;for(let s=0;s<10;s+=1){const r=s%2===0?i:t,a=s/10*Math.PI*2+Math.PI/2-Math.PI,o=Math.cos(a)*r,l=Math.sin(a)*r;s===0?e.moveTo(o,l):e.lineTo(o,l)}e.closePath();const n=new Rn(e,{depth:1.2,bevelEnabled:!0,bevelSize:.4,bevelThickness:.4,bevelSegments:1});return n.translate(0,0,-.6),n}function ev(i,t){const e=new ge;e.name="start-gate";const n=Lt(`gate-${i.style}`,{color:i.accent,emissive:i.accent,emissiveIntensity:1.1,roughness:.4,metalness:.35}),s=mt("gate-pillar",()=>zt(1.3,11,1.3,.1));for(const h of[-1,1]){const u=new Tt(s,n);u.position.set(h*(t+1.6),5.5,0),u.castShadow=!0,e.add(u)}const r=new Tt(mt("gate-beam",()=>zt(t*2+4.6,1.6,1.5,.08)),n);r.position.y=11,r.castShadow=!0,e.add(r);const a=mt("gate-banner",()=>new Ae(t*2+1,2.1)),o=vn(`gate-banner-mat-${i.style}`,()=>new Oe({map:Yh("START",i.edgeA,Qh(i)),side:xe,transparent:!0})),l=new Tt(a,o);l.position.y=9.6,l.rotation.y=Math.PI,e.add(l);const c=new Tt(mt("gate-strip",()=>new Ae(t*2,3)),vn("gate-strip-mat",()=>new Oe({map:Ox(),transparent:!0})));return c.rotation.x=-Math.PI/2,c.position.y=.045,e.add(c),e}function Qh(i){return i.style==="pier"?"vapor":i.style}function nv(i,t){const e=new ge;e.name="boost-pads";const n=mt("boost-pad",()=>{const h=new rn;return h.moveTo(-2.4,-3.4),h.lineTo(0,-1.4),h.lineTo(2.4,-3.4),h.lineTo(2.4,-.6),h.lineTo(0,1.4),h.lineTo(-2.4,-.6),h.closePath(),new Gs(h)}),s=vn(`boost-pad-${i.style}`,()=>new Ce({color:i.edgeA,emissive:i.edgeA,emissiveIntensity:1.5,transparent:!0,opacity:.9,roughness:.3,side:xe})),r=Zh(i.edgeA),a=vn(`boost-glow-${i.style}`,()=>new Oe({map:r,transparent:!0,opacity:.5,blending:wi,depthWrite:!1})),o=mt("boost-glow",()=>new Ae(9,12)),l=new Ee(n,s,t.length),c=new Ee(o,a,t.length);return Ke(l,t.map(h=>({position:h.position.clone().setY(.035),rotationX:-Math.PI/2,rotationZ:h.rotationZ}))),Ke(c,t.map(h=>({position:h.position.clone().setY(.03),rotationX:-Math.PI/2,rotationZ:h.rotationZ}))),e.add(c,l),e}const te=400,kc={vapor:[{text:"NEON",color:0},{text:"DRIFT",color:1},{text:"POP!",color:2},{text:"VAPOR",color:0},{text:"GP 99",color:1},{text:"夜",color:2},{text:"漂移",color:0},{text:"RUSH",color:1}],pop:[{text:"POW!",color:0},{text:"VROOM",color:1},{text:"BANG!",color:2},{text:"ZOOM",color:0},{text:"WOW!",color:1},{text:"GP 99",color:2}],monet:[{text:"Nymphéas",color:0},{text:"Lumière",color:1},{text:"Jardin",color:2},{text:"Giverny",color:0},{text:"Reflets",color:1}],soviet:[{text:"ВПЕРЁД",color:0},{text:"СЛАВА",color:1},{text:"ТРУД",color:2},{text:"РЕКОРД",color:0},{text:"GP 1924",color:1}],anime:[{text:"走れ！",color:0},{text:"最速",color:1},{text:"夕焼け",color:2},{text:"ドリフト",color:0},{text:"GP",color:1}],void:[{text:"VOID",color:0},{text:"GRID",color:1},{text:"0x99",color:2},{text:"NULL",color:0},{text:"DRIFT",color:1}],rain:[{text:"ネオン",color:0},{text:"GHOST",color:1},{text:"夜行",color:2},{text:"PULSE",color:0},{text:"0xE2",color:1},{text:"RAIN",color:2}],ink:[{text:"山水",color:0},{text:"留白",color:1},{text:"墨韵",color:2},{text:"笔锋",color:0},{text:"GP 之境",color:1}],pixel:[{text:"INSERT",color:0},{text:"LAP-1UP",color:1},{text:"8-BIT",color:2},{text:"TURBO",color:0},{text:"GP.99",color:1}],minimal:[{text:"01",color:0},{text:"SPEED",color:1},{text:"02",color:2},{text:"PURE",color:0},{text:"03",color:1}]};class Bc{group=new ge;curve;length;roadHalfWidth;def;segmentCount=te;sampleArc;samples=[];boostPadUs=[.12,.38,.62,.85];lineLateral=[];lineSpeedBase=[];aiSpeedBase=[];brakeProfiles=new Map;visualsBuilt=!1;constructor(t){this.def=typeof t=="string"?es(t):t??es("neon-loop"),this.roadHalfWidth=this.def.roadHalfWidth;const e=this.def.controlPoints.map(([n,s])=>new A(n,0,s));this.curve=new Ah(e,!0,"centripetal"),this.length=this.curve.getLength(),this.sampleArc=this.length/te,this.buildSamples(),this.buildRacingLine()}buildVisuals(){this.visualsBuilt||(this.visualsBuilt=!0,this.group.add(this.buildRoadMesh()),this.group.add(this.buildKerbEdges()),this.group.add(this.buildEdgeLights()),this.group.add(this.buildStartGate()),this.group.add(this.buildBoostPads()),this.group.add(this.buildBillboards()))}buildSamples(){for(let e=0;e<te;e+=1){const n=e/te,s=this.curve.getPointAt(n),r=this.curve.getTangentAt(n).setY(0).normalize(),a=new A(-r.z,0,r.x).normalize(),o=this.curve.getTangentAt((n-1/te+1)%1).setY(0).normalize(),l=this.curve.getTangentAt((n+1/te)%1).setY(0).normalize(),c=o.x*l.z-o.z*l.x,h=ke.clamp(o.dot(l),-1,1),u=Math.acos(h),d=Math.min(u,.09),f=Math.sign(c)*d*te;this.samples.push({position:s,tangent:r,right:a,u:n,curvature:f})}}findClosestU(t,e=0){const s=(f,p)=>{for(let x=-8;x<=8;x+=1){const g=((f+x)%te+te)%te,m=this.samples[g].position.distanceToSquared(t);m<p.dist&&(p.dist=m,p.index=g)}},r=Math.floor(e*te),a={index:r,dist:1/0};s(r,a);const o={index:0,dist:1/0};for(let f=0;f<te;f+=8){const p=this.samples[f].position.distanceToSquared(t);p<o.dist&&(o.dist=p,o.index=f)}s(o.index,o);const c=a.dist<=o.dist+4?a:o,h=this.samples[c.index],d=t.clone().sub(h.position).dot(h.right);return{u:h.u,lateral:d,sampleIndex:c.index}}getSample(t){return this.samples[(t%te+te)%te]}sampleAtU(t){const e=Math.floor((t%1+1)%1*te)%te;return this.samples[e]}pointAt(t,e=0){const n=this.sampleAtU(t);return n.position.clone().addScaledVector(n.right,e)}curvatureAtU(t){return this.sampleAtU(t).curvature}isOnRoad(t){return Math.abs(t)<=this.roadHalfWidth}spawnGrid(t){const e=.985-Math.floor(t/2)*.012,n=t%2===0?-3.2:3.2,s=this.pointAt(e,n),r=this.sampleAtU(e),a=Math.atan2(r.tangent.x,r.tangent.z);return{position:s,heading:a}}buildRoadMesh(){const t=[],e=[],n=[];for(let o=0;o<=te;o+=1){const l=o%te/te,c=this.getSample(o%te),h=c.position.clone().addScaledVector(c.right,-this.roadHalfWidth),u=c.position.clone().addScaledVector(c.right,this.roadHalfWidth);if(t.push(h.x,.02,h.z,u.x,.02,u.z),e.push(0,l*56,1,l*56),o<te){const d=o*2;n.push(d,d+1,d+2,d+1,d+3,d+2)}}const s=new _e;s.setAttribute("position",new ne(t,3)),s.setAttribute("uv",new ne(e,2)),s.setIndex(n),s.computeVertexNormals();const r=Fx(this.def.theme),a=new Tt(s,new Ce({map:r,roughness:this.def.theme.style==="monet"?.8:.62,metalness:.05,color:"#ffffff",emissive:this.def.theme.style==="vapor"||this.def.theme.style==="pier"||this.def.theme.style==="void"?"#4a2a80":"#000000",emissiveIntensity:this.def.theme.style==="pop"?0:.5,side:xe}));return a.receiveShadow=!0,a.renderOrder=2,a.name="road",a}buildKerbEdges(){const t=new ge;t.name="kerbs";const e=this.def.theme,n=new Ce({color:e.edgeB,emissive:e.edgeB,emissiveIntensity:e.style==="pop"?.12:.9,roughness:.5}),s=new Ce({color:e.edgeA,emissive:e.edgeA,emissiveIntensity:e.style==="pop"?.12:.9,roughness:.5}),r=new Pe(.5,.14,1),a=te/2,o=new Ee(r,n,a),l=new Ee(r,s,a),c=this.length/te*2*1.45,h=new ee,u=new un,d=new je,f=new A,p=new A(1,1,c);for(let x=0;x<a;x+=1){const g=this.getSample(x*2),m=Math.atan2(g.tangent.x,g.tangent.z);d.set(0,m,0),u.setFromEuler(d),f.copy(g.position).addScaledVector(g.right,-this.roadHalfWidth-.24).setY(.07),h.compose(f,u,p),o.setMatrixAt(x,h),f.copy(g.position).addScaledVector(g.right,this.roadHalfWidth+.24).setY(.07),h.compose(f,u,p),l.setMatrixAt(x,h)}return o.instanceMatrix.needsUpdate=!0,l.instanceMatrix.needsUpdate=!0,t.add(o,l),t}buildEdgeLights(){const t=[];for(let e=0;e<te;e+=6){const n=this.getSample(e),s=Math.atan2(n.tangent.x,n.tangent.z);t.push({position:n.position.clone().addScaledVector(n.right,-(this.roadHalfWidth+2.2)).setY(0),rotationY:s}),t.push({position:n.position.clone().addScaledVector(n.right,this.roadHalfWidth+2.2).setY(0),rotationY:s})}return Jx(this.def.theme,t)}buildStartGate(){const t=this.sampleAtU(0),e=ev(this.def.theme,this.roadHalfWidth);return e.position.copy(t.position),e.rotation.y=Math.atan2(t.tangent.x,t.tangent.z),e}buildBoostPads(){const t=this.boostPadUs.map(e=>{const n=this.getSample(Math.floor(e*te));return{position:n.position.clone(),rotationZ:-Math.atan2(n.tangent.x,n.tangent.z)}});return nv(this.def.theme,t)}getBoostPadUs(){return this.boostPadUs}buildRacingLine(){const t=te,e=this.samples.map(h=>h.curvature),n=new Array(t);for(let h=0;h<t;h+=1){let u=0;for(let d=-4;d<=4;d+=1)u+=Math.abs(e[((h+d)%t+t)%t]);n[h]=u/9}const s=Math.max(...n,1),r=new Array(t),a=this.roadHalfWidth-2.2;for(let h=0;h<t;h+=1){const u=e[h],d=Math.min(1,n[h]/(s*.55));r[h]=-Math.sign(u||1)*a*d}let o=r;for(let h=0;h<2;h+=1){const u=new Array(t),d=h===0?14:8;for(let f=0;f<t;f+=1){let p=0;for(let x=-d;x<=d;x+=1)p+=o[((f+x)%t+t)%t];u[f]=p/(d*2+1)}o=u}for(let h=0;h<t;h+=1)this.lineLateral.push(ke.clamp(o[h],-a,a));const l=18;for(let h=0;h<t;h+=1){const u=this.length/Math.max(n[h],1e-4),d=Math.sqrt(l*u);this.lineSpeedBase.push(ke.clamp(d,11,60))}const c=18*He*He;for(let h=0;h<t;h+=1){const u=this.length/Math.max(n[h],1e-4),d=Math.sqrt(c*u);this.aiSpeedBase.push(ke.clamp(d,27.5,150))}}lineLateralAt(t){const e=(t%1+1)%1*te,n=Math.floor(e),s=e-n,r=this.lineLateral[n%te],a=this.lineLateral[(n+1)%te];return r+(a-r)*s}lineSpeedBaseAt(t){const e=(t%1+1)%1*te,n=Math.floor(e),s=e-n,r=this.lineSpeedBase[n%te],a=this.lineSpeedBase[(n+1)%te];return r+(a-r)*s}aiSpeedBaseAt(t){const e=(t%1+1)%1*te,n=Math.floor(e),s=e-n,r=this.aiSpeedBase[n%te],a=this.aiSpeedBase[(n+1)%te];return r+(a-r)*s}brakeSpeedProfile(t){return this.brakeProfileFrom(this.lineSpeedBase,t)}aiBrakeSpeedProfile(t){return this.brakeProfileFrom(this.aiSpeedBase,t)}brakeProfileFrom(t,e){const n=`${e}:${t===this.aiSpeedBase?"ai":"player"}`,s=this.brakeProfiles.get(n);if(s)return s;const r=te,a=new Float32Array(r);for(let o=0;o<r;o+=1)a[o]=t[o];for(let o=0;o<2;o+=1)for(let l=r-1;l>=0;l-=1){const c=a[(l+1)%r],h=Math.sqrt(c*c+2*e*this.sampleArc);a[l]>h&&(a[l]=h)}return this.brakeProfiles.set(n,a),a}buildBillboards(){const t=this.def.theme,e=[t.edgeA,t.edgeB,t.accent],n=kc[t.style]??kc.vapor,s=[];for(let r=0;r<12;r+=1){const a=r/12+.03,o=this.getSample(Math.floor(a*te)),c=(r%2===0?-1:1)*(this.roadHalfWidth+10+r%3*3),h=n[r%n.length];s.push({position:o.position.clone().addScaledVector(o.right,c),rotationY:Math.atan2(o.tangent.x,o.tangent.z)+Math.PI,text:h.text,color:e[h.color],height:6.5+r%4*2.5,width:7})}return jx(s,Qh(t))}dispose(){this.group.traverse(t=>{t instanceof Tt&&t.name==="road"&&t.geometry.dispose()})}}const zc={vapor:{tempo:96,scale:[0,3,5,7,10],root:110,pad:"triangle",lead:"square",bass:[0,-1,0,-1,0,-1,2,-1,0,-1,0,-1,4,-1,3,-1],leadSeq:[4,-1,2,3,-1,1,-1,2,4,-1,3,-1,2,-1,1,-1],chords:[[0,3,7],[5,8,12],[3,7,10],[2,5,9]]},pier:{tempo:88,scale:[0,2,4,7,9],root:98,pad:"triangle",lead:"sine",bass:[0,-1,-1,4,-1,-1,0,-1,3,-1,-1,2,-1,-1,0,-1],leadSeq:[4,-1,-1,2,-1,4,-1,-1,3,-1,2,-1,1,-1,-1,-1],chords:[[0,4,7],[3,7,10],[5,9,12],[0,4,9]]},void:{tempo:80,scale:[0,1,5,7,8],root:82,pad:"sawtooth",lead:"triangle",bass:[0,-1,-1,-1,0,-1,-1,-1,1,-1,-1,-1,0,-1,-1,-1],leadSeq:[-1,4,-1,-1,3,-1,-1,1,-1,4,-1,-1,2,-1,-1,-1],chords:[[0,3,7],[1,5,8],[0,4,7],[3,7,11]]},pop:{tempo:118,scale:[0,2,4,5,7,9,11],root:116,pad:"square",lead:"square",bass:[0,0,-1,0,4,-1,0,-1,2,2,-1,2,4,-1,5,-1],leadSeq:[6,5,4,-1,2,4,-1,6,5,4,2,-1,0,2,4,-1],chords:[[0,4,7],[5,9,12],[3,7,10],[7,11,14]]},monet:{tempo:72,scale:[0,2,4,7,9],root:104,pad:"sine",lead:"sine",bass:[0,-1,-1,-1,3,-1,-1,-1,0,-1,-1,-1,4,-1,-1,-1],leadSeq:[4,-1,6,-1,4,2,-1,1,2,-1,-1,4,-1,-1,-1,-1],chords:[[0,4,9],[2,5,9],[4,7,11],[0,3,7]]},soviet:{tempo:104,scale:[0,2,3,5,7,8,10],root:87,pad:"sawtooth",lead:"square",bass:[0,-1,0,0,-1,3,-1,3,0,-1,0,0,-1,2,3,-1],leadSeq:[7,-1,6,5,4,-1,3,-1,4,3,2,-1,3,-1,2,-1],chords:[[0,3,7],[5,8,12],[3,7,10],[0,4,7]]},anime:{tempo:112,scale:[0,2,4,7,9],root:123,pad:"triangle",lead:"sine",bass:[0,-1,4,-1,5,-1,4,-1,0,-1,4,-1,2,-1,4,-1],leadSeq:[4,6,-1,4,-1,2,4,-1,6,-1,4,2,-1,1,2,-1],chords:[[0,4,7],[3,7,11],[5,9,12],[2,5,9]]},rain:{tempo:84,scale:[0,3,5,7,10],root:92,pad:"sawtooth",lead:"sine",bass:[0,-1,-1,0,-1,-1,1,-1,0,-1,-1,3,-1,-1,2,-1],leadSeq:[-1,4,-1,-1,2,-1,4,-1,-1,3,-1,-1,2,-1,-1,-1],chords:[[0,3,7],[1,5,8],[3,7,10],[0,3,8]]},ink:{tempo:66,scale:[0,2,3,7,8],root:98,pad:"sine",lead:"triangle",bass:[0,-1,-1,-1,-1,3,-1,-1,0,-1,-1,-1,2,-1,-1,-1],leadSeq:[4,-1,-1,3,-1,2,-1,-1,3,-1,1,-1,2,-1,-1,-1],chords:[[0,3,7],[2,5,8],[3,7,10],[0,2,7]]},pixel:{tempo:126,scale:[0,2,4,7,9],root:131,pad:"square",lead:"square",bass:[0,0,4,0,0,0,4,0,2,2,5,2,4,4,0,4],leadSeq:[6,-1,4,6,5,-1,4,2,4,-1,6,4,2,-1,4,-1],chords:[[0,4,7],[3,7,10],[5,9,12],[0,4,9]]},minimal:{tempo:92,scale:[0,2,4,6,9],root:110,pad:"sine",lead:"triangle",bass:[0,-1,-1,-1,0,-1,-1,-1,4,-1,-1,-1,2,-1,-1,-1],leadSeq:[4,-1,-1,5,-1,-1,4,-1,6,-1,-1,4,-1,-1,2,-1],chords:[[0,4,9],[2,6,9],[4,7,11],[0,4,7]]}};function yr(i,t){return i*Math.pow(2,t/12)}function iv(i){const t=i.createBuffer(1,i.sampleRate*2,i.sampleRate),e=t.getChannelData(0);for(let n=0;n<e.length;n+=1)e[n]=Math.random()*2-1;return t}class sv{context=null;unlocked=!1;muted=!1;masterVolume=.8;bgmVolume=.7;sfxVolume=.85;engineOsc=null;engineSub=null;engineNoise=null;engineGain=null;engineFilter=null;screechNoise=null;screechGain=null;windNoise=null;windGain=null;buffers=new Map;noiseBuffer=null;samplePaths={award:"audio/award.ogg",go:"audio/go.ogg"};bgmTimer=null;bgmStep=0;bgmNextTime=0;bgmStyle=null;bgmBus=null;bgmPadOscs=[];bgmChordIndex=0;constructor(){const t=()=>{this.unlock(),window.removeEventListener("pointerdown",t),window.removeEventListener("keydown",t)};window.addEventListener("pointerdown",t,{once:!0}),window.addEventListener("keydown",t,{once:!0}),this.preloadSamples()}async preloadSamples(){const t=globalThis.__NDGP_AUDIO__;for(const[e,n]of Object.entries(this.samplePaths))try{const s=t?.[n]??n,r=await fetch(s);if(!r.ok)continue;const a=await r.arrayBuffer();this.pending??=new Map,this.pending.set(e,a)}catch{}this.context&&await this.decodePending()}pending=null;async decodePending(){if(!(!this.context||!this.pending)){for(const[t,e]of this.pending)try{const n=await this.context.decodeAudioData(e.slice(0));this.buffers.set(t,n)}catch{}this.pending=null}}playSample(t,e){if(!this.context||this.muted)return;const n=this.buffers.get(t);if(!n){e();return}const s=this.context.createBufferSource(),r=this.context.createGain();r.gain.value=this.sfxVolume*this.masterVolume,s.buffer=n,s.connect(r).connect(this.context.destination),s.start()}async unlock(){if(this.unlocked)return;const t=window.AudioContext||window.webkitAudioContext;t&&(this.context=new t,await this.context.resume(),this.unlocked=!0,this.noiseBuffer=iv(this.context),this.startEngine(),this.startScreech(),this.startWind(),await this.decodePending())}setVolumes(t,e,n){if(this.masterVolume=t,this.bgmVolume=e,this.sfxVolume=n,this.engineGain&&this.context&&(this.engineGain.gain.value=this.muted?0:this.engineGain.gain.value*0+(this.muted?0:.03*this.masterVolume)),this.bgmBus&&this.context){const s=this.muted?0:.5*this.bgmVolume*this.masterVolume;this.bgmBus.gain.setTargetAtTime(s,this.context.currentTime,.15)}}startEngine(){if(!this.context||this.engineOsc)return;const t=this.context,e=t.createGain(),n=t.createBiquadFilter();n.type="lowpass",n.frequency.value=400,n.Q.value=1;const s=t.createOscillator();s.type="sawtooth",s.frequency.value=60;const r=t.createGain();r.gain.value=.55;const a=t.createOscillator();a.type="square",a.frequency.value=30;const o=t.createGain();o.gain.value=.3;const l=t.createBufferSource();l.buffer=this.noiseBuffer,l.loop=!0;const c=t.createGain();c.gain.value=.12,s.connect(r).connect(n),a.connect(o).connect(n),l.connect(c).connect(n),n.connect(e).connect(t.destination),e.gain.value=0,s.start(),a.start(),l.start(),this.engineOsc=s,this.engineSub=a,this.engineNoise=l,this.engineGain=e,this.engineFilter=n}updateEngine(t,e,n,s){if(!this.context||!this.engineOsc||!this.engineGain||!this.engineFilter||!this.engineSub)return;const r=this.context.currentTime;if(this.muted||!s){this.engineGain.gain.setTargetAtTime(0,r,.1),this.updateScreech(0,0),this.updateWind(0);return}const a=55+t*88+(n?28:0);this.engineOsc.frequency.setTargetAtTime(a,r,.05),this.engineSub.frequency.setTargetAtTime(a*.5,r,.05),this.engineFilter.frequency.setTargetAtTime(300+t*1400+(n?500:0),r,.08),this.engineFilter.Q.value=e?4:1;const o=.03+t*.045;this.engineGain.gain.setTargetAtTime(o*this.masterVolume,r,.1),this.updateScreech(e?.5+t*.5:0,e?.9:0),this.updateWind(t)}startScreech(){if(!this.context||this.screechNoise)return;const t=this.context,e=t.createBufferSource();e.buffer=this.noiseBuffer,e.loop=!0;const n=t.createBiquadFilter();n.type="bandpass",n.frequency.value=950,n.Q.value=6;const s=t.createGain();s.gain.value=0,e.connect(n).connect(s).connect(t.destination),e.start(),this.screechNoise=e,this.screechGain=s}updateScreech(t,e){if(!this.context||!this.screechGain)return;const n=this.context.currentTime;this.screechGain.gain.setTargetAtTime(t*.05*this.masterVolume*(this.muted?0:1),n,.08),this.screechNoise&&this.screechNoise.playbackRate.setTargetAtTime(.9+e*.3,n,.1)}startWind(){if(!this.context||this.windNoise)return;const t=this.context,e=t.createBufferSource();e.buffer=this.noiseBuffer,e.loop=!0;const n=t.createBiquadFilter();n.type="lowpass",n.frequency.value=320;const s=t.createGain();s.gain.value=0,e.connect(n).connect(s).connect(t.destination),e.start(),this.windNoise=e,this.windGain=s}updateWind(t){if(!this.context||!this.windGain)return;const e=this.context.currentTime;this.windGain.gain.setTargetAtTime(t*t*.055*this.masterVolume*(this.muted?0:1),e,.15),this.windNoise&&this.windNoise.playbackRate.setTargetAtTime(.7+t*.8,e,.2)}startBgmForTheme(t){if(!this.context)return;const e=zc[t.style]??zc.vapor;if(this.bgmStyle===e&&this.bgmTimer!==null)return;this.stopBgm(),this.bgmStyle=e;const n=this.context,s=n.createGain();s.gain.value=this.muted?0:.5*this.bgmVolume*this.masterVolume,s.connect(n.destination),this.bgmBus=s,this.bgmPadOscs=[];const r=n.createGain();r.gain.value=.05,r.connect(s);for(let l=0;l<3;l+=1){const c=n.createOscillator();c.type=e.pad,c.frequency.value=yr(e.root,e.chords[0][l]),c.connect(r),c.start(),this.bgmPadOscs.push({osc:c,gain:r})}this.bgmStep=0,this.bgmChordIndex=0,this.bgmNextTime=n.currentTime+.1;const a=60/e.tempo/4,o=()=>{if(!(!this.context||!this.bgmStyle||!this.bgmBus)){for(;this.bgmNextTime<this.context.currentTime+.25;)this.scheduleStep(this.bgmStep,this.bgmNextTime,a),this.bgmStep=(this.bgmStep+1)%16,this.bgmNextTime+=a;this.bgmTimer=window.setTimeout(o,90)}};o()}scheduleStep(t,e,n){const s=this.context,r=this.bgmStyle,a=r.bass[t];if(a>=0){const l=s.createOscillator();l.type="sawtooth",l.frequency.value=yr(r.root/2,r.scale[a%r.scale.length]);const c=s.createGain();c.gain.setValueAtTime(1e-4,e),c.gain.exponentialRampToValueAtTime(.12,e+.01),c.gain.exponentialRampToValueAtTime(1e-4,e+n*1.8);const h=s.createBiquadFilter();h.type="lowpass",h.frequency.value=480,l.connect(h).connect(c).connect(this.bgmBus),l.start(e),l.stop(e+n*2)}const o=r.leadSeq[t];if(o>=0){const l=s.createOscillator();l.type=r.lead,l.frequency.value=yr(r.root*2,r.scale[o%r.scale.length]);const c=s.createGain();c.gain.setValueAtTime(1e-4,e),c.gain.exponentialRampToValueAtTime(.07,e+.015),c.gain.exponentialRampToValueAtTime(1e-4,e+n*1.4),l.connect(c).connect(this.bgmBus),l.start(e),l.stop(e+n*1.6)}if(t===0){this.bgmChordIndex=(this.bgmChordIndex+1)%r.chords.length;const l=r.chords[this.bgmChordIndex];this.bgmPadOscs.forEach((c,h)=>{c.osc.frequency.setTargetAtTime(yr(r.root,l[h%l.length]),e,.4)})}}stopBgm(){this.bgmTimer!==null&&(window.clearTimeout(this.bgmTimer),this.bgmTimer=null);for(const t of this.bgmPadOscs)try{t.osc.stop()}catch{}if(this.bgmPadOscs=[],this.bgmBus){try{this.bgmBus.disconnect()}catch{}this.bgmBus=null}this.bgmStyle=null}lap(){this.blip(520,780,.15,"triangle"),window.setTimeout(()=>this.blip(780,1040,.18,"triangle"),120)}boost(){this.blip(200,900,.2,"sawtooth"),this.whoosh()}whoosh(){if(!this.context||this.muted)return;const t=this.context,e=t.createBufferSource();e.buffer=this.noiseBuffer;const n=t.createBiquadFilter();n.type="bandpass",n.Q.value=1.4;const s=t.currentTime;n.frequency.setValueAtTime(300,s),n.frequency.exponentialRampToValueAtTime(2400,s+.35);const r=t.createGain();r.gain.setValueAtTime(1e-4,s),r.gain.exponentialRampToValueAtTime(.14*this.sfxVolume*this.masterVolume,s+.06),r.gain.exponentialRampToValueAtTime(1e-4,s+.45),e.connect(n).connect(r).connect(t.destination),e.start(s),e.stop(s+.5)}impact(){if(!this.context||this.muted)return;this.blip(120,60,.12,"square");const t=this.context,e=t.createBufferSource();e.buffer=this.noiseBuffer;const n=t.createGain(),s=t.currentTime;n.gain.setValueAtTime(.16*this.sfxVolume*this.masterVolume,s),n.gain.exponentialRampToValueAtTime(1e-4,s+.16),e.connect(n).connect(t.destination),e.start(s),e.stop(s+.18)}miniTurbo(t){this.blip(300+t*120,900+t*200,.16,"triangle")}blip(t,e,n,s){if(!this.context||this.muted||this.context.state!=="running")return;const r=this.context.createOscillator(),a=this.context.createGain(),o=this.context.currentTime,l=.06*this.sfxVolume*this.masterVolume;r.type=s,r.frequency.setValueAtTime(t,o),r.frequency.exponentialRampToValueAtTime(Math.max(40,e),o+n),a.gain.setValueAtTime(1e-4,o),a.gain.exponentialRampToValueAtTime(Math.max(2e-4,l),o+.02),a.gain.exponentialRampToValueAtTime(1e-4,o+n),r.connect(a).connect(this.context.destination),r.start(o),r.stop(o+n+.05)}countdownBeep(){this.blip(440,440,.08,"square")}goBeep(){this.playSample("go",()=>this.blip(660,1200,.22,"triangle"))}menuConfirm(){this.blip(520,780,.08,"triangle")}menuCancel(){this.blip(420,280,.08,"triangle")}award(){this.playSample("award",()=>{this.blip(520,780,.12,"triangle"),window.setTimeout(()=>this.blip(780,1040,.18,"triangle"),100)})}pickup(t){this.blip(320+t*20,700+t*20,.14,"triangle")}dispose(){this.stopBgm();try{this.engineOsc?.stop(),this.engineSub?.stop(),this.engineNoise?.stop(),this.screechNoise?.stop(),this.windNoise?.stop()}catch{}this.engineOsc=null,this.engineSub=null,this.engineNoise=null,this.screechNoise=null,this.windNoise=null,this.engineGain=null,this.screechGain=null,this.windGain=null,this.context?.close(),this.context=null}}const La={near:{dist:8.2,height:3.1,fov:62,lead:7},mid:{dist:11,height:4,fov:58,lead:7},far:{dist:14.5,height:5.2,fov:54,lead:8.5}};class rv{constructor(t,e=4.5){this.camera=t,this.lag=e}desired=new A;lookAt=new A;forward=new A;offset=new A;baseFov=58;currentFov=58;trauma=0;preset="mid";setPreset(t,e=!1){this.preset=t,e&&this.reapplyBase()}get currentPreset(){return this.preset}reapplyBase(){const t=La[this.preset];this.baseFov=t.fov,this.currentFov=t.fov,this.camera.fov=t.fov,this.camera.updateProjectionMatrix()}snapTo(t,e){const n=La[this.preset];this.forward.set(Math.sin(e),0,Math.cos(e)),this.offset.copy(this.forward).multiplyScalar(-n.dist).add(new A(0,n.height,0)),this.camera.position.copy(t).add(this.offset),this.lookAt.copy(t).addScaledVector(this.forward,6).add(new A(0,1.2,0)),this.camera.lookAt(this.lookAt),this.reapplyBase()}update(t,e,n,s,r,a){const o=La[this.preset],l=ke.clamp(s/50,0,1),c=o.dist+l*2.5,h=o.height+l*.8,u=r?o.lead+2:o.lead;if(this.forward.set(Math.sin(n),0,Math.cos(n)),this.offset.copy(this.forward).multiplyScalar(-c),this.offset.y=h,r){const p=new A(this.forward.z,0,-this.forward.x);this.offset.addScaledVector(p,1.2)}this.desired.copy(e).add(this.offset);const d=1-Math.exp(-this.lag*t);this.camera.position.lerp(this.desired,d),this.lookAt.copy(e).addScaledVector(this.forward,u),this.lookAt.y=1.1,this.camera.lookAt(this.lookAt);const f=this.baseFov+l*14+(a?8:0)+(r?3:0);if(this.currentFov+=(f-this.currentFov)*(1-Math.exp(-6*t)),Math.abs(this.camera.fov-this.currentFov)>.05&&(this.camera.fov=this.currentFov,this.camera.updateProjectionMatrix()),this.trauma>.001){const p=this.trauma*this.trauma,x=performance.now()/1e3;this.camera.position.x+=(Math.sin(x*47)+Math.sin(x*31))*.08*p,this.camera.position.y+=Math.sin(x*39)*.05*p,this.camera.rotation.z+=Math.sin(x*53)*.02*p,this.trauma=Math.max(0,this.trauma-t*2.2)}}addTrauma(t){this.trauma=Math.min(1,this.trauma+t)}}/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.21.0
 * @author George Michael Brower
 * @license MIT
 */class Pn{constructor(t,e,n,s,r="div"){this.parent=t,this.object=e,this.property=n,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(r),this.domElement.classList.add("lil-controller"),this.domElement.classList.add(s),this.$name=document.createElement("div"),this.$name.classList.add("lil-name"),Pn.nextNameID=Pn.nextNameID||0,this.$name.id=`lil-gui-name-${++Pn.nextNameID}`,this.$widget=document.createElement("div"),this.$widget.classList.add("lil-widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener("keydown",a=>a.stopPropagation()),this.domElement.addEventListener("keyup",a=>a.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(n)}name(t){return this._name=t,this.$name.textContent=t,this}onChange(t){return this._onChange=t,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(t=!0){return this.disable(!t)}disable(t=!0){return t===this._disabled?this:(this._disabled=t,this.domElement.classList.toggle("lil-disabled",t),this.$disable.toggleAttribute("disabled",t),this)}show(t=!0){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(t){const e=this.parent.add(this.object,this.property,t);return e.name(this._name),this.destroy(),e}min(t){return this}max(t){return this}step(t){return this}decimals(t){return this}listen(t=!0){return this._listening=t,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const t=this.save();t!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=t}getValue(){return this.object[this.property]}setValue(t){return this.getValue()!==t&&(this.object[this.property]=t,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(t){return this.setValue(t),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class av extends Pn{constructor(t,e,n){super(t,e,n,"lil-boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function Lo(i){let t,e;return(t=i.match(/(#|0x)?([a-f0-9]{6})/i))?e=t[2]:(t=i.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?e=parseInt(t[1]).toString(16).padStart(2,0)+parseInt(t[2]).toString(16).padStart(2,0)+parseInt(t[3]).toString(16).padStart(2,0):(t=i.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(e=t[1]+t[1]+t[2]+t[2]+t[3]+t[3]),e?"#"+e:!1}const ov={isPrimitive:!0,match:i=>typeof i=="string",fromHexString:Lo,toHexString:Lo},ks={isPrimitive:!0,match:i=>typeof i=="number",fromHexString:i=>parseInt(i.substring(1),16),toHexString:i=>"#"+i.toString(16).padStart(6,0)},lv={isPrimitive:!1,match:i=>Array.isArray(i)||ArrayBuffer.isView(i),fromHexString(i,t,e=1){const n=ks.fromHexString(i);t[0]=(n>>16&255)/255*e,t[1]=(n>>8&255)/255*e,t[2]=(n&255)/255*e},toHexString([i,t,e],n=1){n=255/n;const s=i*n<<16^t*n<<8^e*n<<0;return ks.toHexString(s)}},cv={isPrimitive:!1,match:i=>Object(i)===i,fromHexString(i,t,e=1){const n=ks.fromHexString(i);t.r=(n>>16&255)/255*e,t.g=(n>>8&255)/255*e,t.b=(n&255)/255*e},toHexString({r:i,g:t,b:e},n=1){n=255/n;const s=i*n<<16^t*n<<8^e*n<<0;return ks.toHexString(s)}},hv=[ov,ks,lv,cv];function uv(i){return hv.find(t=>t.match(i))}class dv extends Pn{constructor(t,e,n,s){super(t,e,n,"lil-color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=uv(this.initialValue),this._rgbScale=s,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const r=Lo(this.$text.value);r&&this._setValueFromHexString(r)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(t){if(this._format.isPrimitive){const e=this._format.fromHexString(t);this.setValue(e)}else this._format.fromHexString(t,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(t){return this._setValueFromHexString(t),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class Ia extends Pn{constructor(t,e,n){super(t,e,n,"lil-function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",s=>{s.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class fv extends Pn{constructor(t,e,n,s,r,a){super(t,e,n,"lil-number"),this._initInput(),this.min(s),this.max(r);const o=a!==void 0;this.step(o?a:this._getImplicitStep(),o),this.updateDisplay()}decimals(t){return this._decimals=t,this.updateDisplay(),this}min(t){return this._min=t,this._onUpdateMinMax(),this}max(t){return this._max=t,this._onUpdateMinMax(),this}step(t,e=!0){return this._step=t,this._stepExplicit=e,this}updateDisplay(){const t=this.getValue();if(this._hasSlider){let e=(t-this._min)/(this._max-this._min);e=Math.max(0,Math.min(e,1)),this.$fill.style.width=e*100+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?t:t.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),window.matchMedia("(pointer: coarse)").matches&&(this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any")),this.$widget.appendChild(this.$input),this.$disable=this.$input;const e=()=>{let v=parseFloat(this.$input.value);isNaN(v)||(this._stepExplicit&&(v=this._snap(v)),this.setValue(this._clamp(v)))},n=v=>{const M=parseFloat(this.$input.value);isNaN(M)||(this._snapClampSetValue(M+v),this.$input.value=this.getValue())},s=v=>{v.key==="Enter"&&this.$input.blur(),v.code==="ArrowUp"&&(v.preventDefault(),n(this._step*this._arrowKeyMultiplier(v))),v.code==="ArrowDown"&&(v.preventDefault(),n(this._step*this._arrowKeyMultiplier(v)*-1))},r=v=>{this._inputFocused&&(v.preventDefault(),n(this._step*this._normalizeMouseWheel(v)))};let a=!1,o,l,c,h,u;const d=5,f=v=>{o=v.clientX,l=c=v.clientY,a=!0,h=this.getValue(),u=0,window.addEventListener("mousemove",p),window.addEventListener("mouseup",x)},p=v=>{if(a){const M=v.clientX-o,S=v.clientY-l;Math.abs(S)>d?(v.preventDefault(),this.$input.blur(),a=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(M)>d&&x()}if(!a){const M=v.clientY-c;u-=M*this._step*this._arrowKeyMultiplier(v),h+u>this._max?u=this._max-h:h+u<this._min&&(u=this._min-h),this._snapClampSetValue(h+u)}c=v.clientY},x=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",p),window.removeEventListener("mouseup",x)},g=()=>{this._inputFocused=!0},m=()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()};this.$input.addEventListener("input",e),this.$input.addEventListener("keydown",s),this.$input.addEventListener("wheel",r,{passive:!1}),this.$input.addEventListener("mousedown",f),this.$input.addEventListener("focus",g),this.$input.addEventListener("blur",m)}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("lil-slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("lil-fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("lil-has-slider");const t=(m,v,M,S,R)=>(m-v)/(M-v)*(R-S)+S,e=m=>{const v=this.$slider.getBoundingClientRect();let M=t(m,v.left,v.right,this._min,this._max);this._snapClampSetValue(M)},n=m=>{this._setDraggingStyle(!0),e(m.clientX),window.addEventListener("mousemove",s),window.addEventListener("mouseup",r)},s=m=>{e(m.clientX)},r=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",r)};let a=!1,o,l;const c=m=>{m.preventDefault(),this._setDraggingStyle(!0),e(m.touches[0].clientX),a=!1},h=m=>{m.touches.length>1||(this._hasScrollBar?(o=m.touches[0].clientX,l=m.touches[0].clientY,a=!0):c(m),window.addEventListener("touchmove",u,{passive:!1}),window.addEventListener("touchend",d))},u=m=>{if(a){const v=m.touches[0].clientX-o,M=m.touches[0].clientY-l;Math.abs(v)>Math.abs(M)?c(m):(window.removeEventListener("touchmove",u),window.removeEventListener("touchend",d))}else m.preventDefault(),e(m.touches[0].clientX)},d=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",u),window.removeEventListener("touchend",d)},f=this._callOnFinishChange.bind(this),p=400;let x;const g=m=>{if(Math.abs(m.deltaX)<Math.abs(m.deltaY)&&this._hasScrollBar)return;m.preventDefault();const M=this._normalizeMouseWheel(m)*this._step;this._snapClampSetValue(this.getValue()+M),this.$input.value=this.getValue(),clearTimeout(x),x=setTimeout(f,p)};this.$slider.addEventListener("mousedown",n),this.$slider.addEventListener("touchstart",h,{passive:!1}),this.$slider.addEventListener("wheel",g,{passive:!1})}_setDraggingStyle(t,e="horizontal"){this.$slider&&this.$slider.classList.toggle("lil-active",t),document.body.classList.toggle("lil-dragging",t),document.body.classList.toggle(`lil-${e}`,t)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(t){let{deltaX:e,deltaY:n}=t;return Math.floor(t.deltaY)!==t.deltaY&&t.wheelDelta&&(e=0,n=-t.wheelDelta/120,n*=this._stepExplicit?1:10),e+-n}_arrowKeyMultiplier(t){let e=this._stepExplicit?1:10;return t.shiftKey?e*=10:t.altKey&&(e/=10),e}_snap(t){let e=0;return this._hasMin?e=this._min:this._hasMax&&(e=this._max),t-=e,t=Math.round(t/this._step)*this._step,t+=e,t=parseFloat(t.toPrecision(15)),t}_clamp(t){return t<this._min&&(t=this._min),t>this._max&&(t=this._max),t}_snapClampSetValue(t){this.setValue(this._clamp(this._snap(t)))}get _hasScrollBar(){const t=this.parent.root.$children;return t.scrollHeight>t.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class pv extends Pn{constructor(t,e,n,s){super(t,e,n,"lil-option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("lil-focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("lil-focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(s)}options(t){return this._values=Array.isArray(t)?t:Object.values(t),this._names=Array.isArray(t)?t:Object.keys(t),this.$select.replaceChildren(),this._names.forEach(e=>{const n=document.createElement("option");n.textContent=e,this.$select.appendChild(n)}),this.updateDisplay(),this}updateDisplay(){const t=this.getValue(),e=this._values.indexOf(t);return this.$select.selectedIndex=e,this.$display.textContent=e===-1?t:this._names[e],this}}class mv extends Pn{constructor(t,e,n){super(t,e,n,"lil-string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("spellcheck","false"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",s=>{s.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}var gv=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.lil-root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.lil-root > .lil-children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.lil-allow-touch-styles, .lil-gui.lil-allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.lil-force-touch-styles, .lil-gui.lil-force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.lil-auto-place, .lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-controller.lil-disabled {
  opacity: 0.5;
}
.lil-controller.lil-disabled, .lil-controller.lil-disabled * {
  pointer-events: none !important;
}
.lil-controller > .lil-name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-controller .lil-widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-controller.lil-string input {
  color: var(--string-color);
}
.lil-controller.lil-boolean {
  cursor: pointer;
}
.lil-controller.lil-color .lil-display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-controller.lil-color .lil-display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-controller.lil-color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-controller.lil-color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-controller.lil-option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-controller.lil-option .lil-display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-display.lil-focus {
    background: var(--focus-color);
  }
}
.lil-controller.lil-option .lil-display.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-option .lil-display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-controller.lil-option .lil-widget,
.lil-controller.lil-option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-widget:hover .lil-display {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number input {
  color: var(--number-color);
}
.lil-controller.lil-number.lil-has-slider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-controller.lil-number .lil-slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-controller.lil-number .lil-slider:hover {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number .lil-slider.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-number .lil-slider.lil-active .lil-fill {
  opacity: 0.95;
}
.lil-controller.lil-number .lil-fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-dragging * {
  cursor: ew-resize !important;
}
.lil-dragging.lil-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .lil-title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .lil-title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .lil-title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-dragging) .lil-gui .lil-title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .lil-title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.lil-root > .lil-title:focus {
  text-decoration: none !important;
}
.lil-gui.lil-closed > .lil-title:before {
  content: "▸";
}
.lil-gui.lil-closed > .lil-children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.lil-closed:not(.lil-transition) > .lil-children {
  display: none;
}
.lil-gui.lil-transition > .lil-children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .lil-children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.lil-root > .lil-children > .lil-gui > .lil-title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.lil-root > .lil-children > .lil-gui.lil-closed > .lil-title {
  border-bottom-color: transparent;
}
.lil-gui + .lil-controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .lil-title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .lil-children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .lil-controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .lil-controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .lil-controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .lil-controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .lil-controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAALkAAsAAAAABtQAAAKVAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACDMgqBBIEbATYCJAMUCwwABCAFhAoHgQQbHAbIDiUFEYVARAAAYQTVWNmz9MxhEgodq49wYRUFKE8GWNiUBxI2LBRaVnc51U83Gmhs0Q7JXWMiz5eteLwrKwuxHO8VFxUX9UpZBs6pa5ABRwHA+t3UxUnH20EvVknRerzQgX6xC/GH6ZUvTcAjAv122dF28OTqCXrPuyaDER30YBA1xnkVutDDo4oCi71Ca7rrV9xS8dZHbPHefsuwIyCpmT7j+MnjAH5X3984UZoFFuJ0yiZ4XEJFxjagEBeqs+e1iyK8Xf/nOuwF+vVK0ur765+vf7txotUi0m3N0m/84RGSrBCNrh8Ee5GjODjF4gnWP+dJrH/Lk9k4oT6d+gr6g/wssA2j64JJGP6cmx554vUZnpZfn6ZfX2bMwPPrlANsB86/DiHjhl0OP+c87+gaJo/gY084s3HoYL/ZkWHTRfBXvvoHnnkHvngKun4KBE/ede7tvq3/vQOxDXB1/fdNz6XbPdcr0Vhpojj9dG+owuSKFsslCi1tgEjirjXdwMiov2EioadxmqTHUCIwo8NgQaeIasAi0fTYSPTbSmwbMOFduyh9wvBrESGY0MtgRjtgQR8Q1bRPohn2UoCRZf9wyYANMXFeJTysqAe0I4mrherOekFdKMrYvJjLvOIUM9SuwYB5DVZUwwVjJJOaUnZCmcEkIZZrKqNvRGRMvmFZsmhP4VMKCSXBhSqUBxgMS7h0cZvEd71AWkEhGWaeMFcNnpqyJkyXgYL7PQ1MoSq0wDAkRtJIijkZSmqYTiSImfLiSWXIZwhRh3Rug2X0kk1Dgj+Iu43u5p98ghopcpSo0Uyc8SnjlYX59WUeaMoDqmVD2TOWD9a4pCRAzf2ECgwGcrHjPOWY9bNxq/OL3I/QjwEAAAA=") format("woff2");
}`;function xv(i){const t=document.createElement("style");t.innerHTML=i;const e=document.querySelector("head link[rel=stylesheet], head style");e?document.head.insertBefore(t,e):document.head.appendChild(t)}let Gc=!1;class rl{constructor({parent:t,autoPlace:e=t===void 0,container:n,width:s,title:r="Controls",closeFolders:a=!1,injectStyles:o=!0,touchStyles:l=!0}={}){if(this.parent=t,this.root=t?t.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("button"),this.$title.classList.add("lil-title"),this.$title.setAttribute("aria-expanded",!0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("lil-children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(r),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add("lil-root"),l&&this.domElement.classList.add("lil-allow-touch-styles"),!Gc&&o&&(xv(gv),Gc=!0),n?n.appendChild(this.domElement):e&&(this.domElement.classList.add("lil-auto-place","autoPlace"),document.body.appendChild(this.domElement)),s&&this.domElement.style.setProperty("--width",s+"px"),this._closeFolders=a}add(t,e,n,s,r){if(Object(n)===n)return new pv(this,t,e,n);const a=t[e];switch(typeof a){case"number":return new fv(this,t,e,n,s,r);case"boolean":return new av(this,t,e);case"string":return new mv(this,t,e);case"function":return new Ia(this,t,e)}console.error(`gui.add failed
	property:`,e,`
	object:`,t,`
	value:`,a)}addColor(t,e,n=1){return new dv(this,t,e,n)}addFolder(t){const e=new rl({parent:this,title:t});return this.root._closeFolders&&e.close(),e}load(t,e=!0){return t.controllers&&this.controllers.forEach(n=>{n instanceof Ia||n._name in t.controllers&&n.load(t.controllers[n._name])}),e&&t.folders&&this.folders.forEach(n=>{n._title in t.folders&&n.load(t.folders[n._title])}),this}save(t=!0){const e={controllers:{},folders:{}};return this.controllers.forEach(n=>{if(!(n instanceof Ia)){if(n._name in e.controllers)throw new Error(`Cannot save GUI with duplicate property "${n._name}"`);e.controllers[n._name]=n.save()}}),t&&this.folders.forEach(n=>{if(n._title in e.folders)throw new Error(`Cannot save GUI with duplicate folder "${n._title}"`);e.folders[n._title]=n.save()}),e}open(t=!0){return this._setClosed(!t),this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("lil-closed",this._closed),this}close(){return this.open(!1)}_setClosed(t){this._closed!==t&&(this._closed=t,this._callOnOpenClose(this))}show(t=!0){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(t=!0){return this._setClosed(!t),this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const e=this.$children.clientHeight;this.$children.style.height=e+"px",this.domElement.classList.add("lil-transition");const n=r=>{r.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("lil-transition"),this.$children.removeEventListener("transitionend",n))};this.$children.addEventListener("transitionend",n);const s=t?this.$children.scrollHeight:0;this.domElement.classList.toggle("lil-closed",!t),requestAnimationFrame(()=>{this.$children.style.height=s+"px"})}),this}title(t){return this._title=t,this.$title.textContent=t,this}reset(t=!0){return(t?this.controllersRecursive():this.controllers).forEach(n=>n.reset()),this}onChange(t){return this._onChange=t,this}_callOnChange(t){this.parent&&this.parent._callOnChange(t),this._onChange!==void 0&&this._onChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t})}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(t){this.parent&&this.parent._callOnFinishChange(t),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t})}onOpenClose(t){return this._onOpenClose=t,this}_callOnOpenClose(t){this.parent&&this.parent._callOnOpenClose(t),this._onOpenClose!==void 0&&this._onOpenClose.call(this,t)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(t=>t.destroy())}controllersRecursive(){let t=Array.from(this.controllers);return this.folders.forEach(e=>{t=t.concat(e.controllersRecursive())}),t}foldersRecursive(){let t=Array.from(this.folders);return this.folders.forEach(e=>{t=t.concat(e.foldersRecursive())}),t}}class vv{gui=null;constructor(t,e){if(!new URLSearchParams(window.location.search).has("debug"))return;this.gui=new rl({title:"Neon Drift tuning"});const s=this.gui.addFolder("Drive");s.add(t,"accel",10,50,.5),s.add(t,"maxSpeed",20,70,.5),s.add(t,"boostSpeed",30,80,.5),s.add(t,"steerRate",1,5,.05),s.add(t,"grip",3,16,.1),s.add(t,"driftGrip",.5,6,.1),s.add(t,"drag",0,2,.05);const r=this.gui.addFolder("Camera");r.add(t,"cameraLag",1,12,.1).onChange(()=>e()),r.add(t,"maxDpr",1,2,.25).onChange(e),r.add(t,"exposure",.6,1.8,.01).onChange(e)}setHidden(t){this.gui&&(t?this.gui.hide():this.gui.show())}dispose(){this.gui?.destroy(),this.gui=null}}function _v(i,t,e,n){return i==="time-trial"?e?3:1:t===1&&e?3:t<=3||e?2:t<=Math.max(2,Math.ceil(n*.6))?1:0}const tu={"neon-loop":22,"sunset-pier":19,"void-grid":18,"pop-burst":23,"monet-lily":23,"red-october":23,"sakura-dash":21,"neon-rain":24,"ink-wash":19,"pixel-rush":20,"minimal-clean":21};function yv(i){return tu[i]??0}function eu(i,t){const e=yv(i);return t>0&&e>0&&t<=e}function Mv(i){const t=hn.findIndex(e=>e.id===i);return t<0||t+1>=hn.length?null:hn[t+1].id}const Sv=[{id:"tire",nameZh:"轮胎",visible:!0},{id:"rim",nameZh:"轮毂",visible:!0},{id:"spoiler",nameZh:"尾翼",visible:!0},{id:"exhaust",nameZh:"排气",visible:!0},{id:"engine",nameZh:"引擎",visible:!1},{id:"turbo",nameZh:"涡轮",visible:!1},{id:"suspension",nameZh:"悬挂",visible:!1},{id:"brakes",nameZh:"制动",visible:!1}],Bs=[{id:"tire-street",name:"街胎",category:"tire",price:0,desc:"均衡的通用胎",stats:{},visual:"street"},{id:"tire-slick",name:"光头胎",category:"tire",price:450,desc:"最大抓地，湿地弱",stats:{grip:1.12,driftGrip:1.1},visual:"slick"},{id:"tire-offroad",name:"全地形胎",category:"tire",price:350,desc:"侧向稳定，速度略减",stats:{grip:1.06,driftGrip:1.18,maxSpeed:.97},visual:"offroad"},{id:"tire-whitewall",name:"白边胎",category:"tire",price:250,desc:"复古颜值，轻量提升",stats:{steerRate:1.04},visual:"whitewall"},{id:"rim-star",name:"五辐轮毂",category:"rim",price:0,desc:"原厂经典",stats:{},visual:"star"},{id:"rim-tuner",name:"电镀轮毂",category:"rim",price:300,desc:"更轻的簧下质量",stats:{steerRate:1.06,accel:1.02},visual:"tuner"},{id:"rim-aero",name:"气动轮毂",category:"rim",price:550,desc:"降低风阻",stats:{maxSpeed:1.04,boostSpeed:1.02},visual:"aero"},{id:"spoiler-wing",name:"原厂 GT 尾翼",category:"spoiler",price:0,desc:"标配下压力",stats:{},visual:"wing"},{id:"spoiler-none",name:"拆除尾翼",category:"spoiler",price:100,desc:"最轻，极速略高",stats:{maxSpeed:1.02},visual:"none"},{id:"spoiler-ducktail",name:"运动鸭尾",category:"spoiler",price:350,desc:"低调稳定",stats:{grip:1.05,maxSpeed:1.01},visual:"ducktail"},{id:"spoiler-bigwing",name:"双层大尾翼",category:"spoiler",price:1100,desc:"赛道级下压力",stats:{grip:1.16,driftGrip:1.12,steerRate:1.08,maxSpeed:.95},visual:"bigwing"},{id:"exhaust-twin",name:"原厂双出",category:"exhaust",price:0,desc:"原厂声浪",stats:{},visual:"twin"},{id:"exhaust-single",name:"单出轻量",category:"exhaust",price:150,desc:"减重改装",stats:{maxSpeed:1.01,steerRate:1.01},visual:"single"},{id:"exhaust-quad",name:"四出排气",category:"exhaust",price:700,desc:"高转爆发",stats:{accel:1.06,boostSpeed:1.05},visual:"quad"},{id:"engine-stock",name:"原厂引擎",category:"engine",price:0,desc:"可靠耐用",stats:{}},{id:"engine-stage1",name:"一阶引擎",category:"engine",price:800,desc:"进排气 + 程序",stats:{accel:1.08,maxSpeed:1.03}},{id:"engine-stage2",name:"二阶引擎",category:"engine",price:1800,desc:"锻造内部件",stats:{accel:1.15,maxSpeed:1.07,boostSpeed:1.05}},{id:"turbo-none",name:"自然吸气",category:"turbo",price:0,desc:"线性输出",stats:{}},{id:"turbo-single",name:"单涡轮",category:"turbo",price:1e3,desc:"氮气效率提升",stats:{boostSpeed:1.08,accel:1.04,boostDrain:.94}},{id:"turbo-twin",name:"双涡轮",category:"turbo",price:2200,desc:"暴力氮气",stats:{boostSpeed:1.16,accel:1.08,boostDrain:.86,steerRate:.98}},{id:"susp-stock",name:"原厂悬挂",category:"suspension",price:0,desc:"舒适取向",stats:{}},{id:"susp-sport",name:"运动悬挂",category:"suspension",price:550,desc:"车身更听话",stats:{steerRate:1.07,grip:1.05}},{id:"susp-race",name:"赛道悬挂",category:"suspension",price:1500,desc:"贴地飞行",stats:{steerRate:1.12,grip:1.1,driftGrip:1.06}},{id:"brake-stock",name:"原厂制动",category:"brakes",price:0,desc:"日常够用",stats:{}},{id:"brake-big",name:"四活塞卡钳",category:"brakes",price:700,desc:"重刹不衰减",stats:{brakeForce:1.2,grip:1.02}}];function di(i){return Bs.find(t=>t.id===i)??Bs.find(t=>t.price===0)}function zn(i){const t=Bs.find(e=>e.category===i&&e.price===0);return t?t.id:Bs.find(e=>e.category===i).id}function nu(){return{tire:zn("tire"),rim:zn("rim"),spoiler:zn("spoiler"),exhaust:zn("exhaust"),engine:zn("engine"),turbo:zn("turbo"),suspension:zn("suspension"),brakes:zn("brakes")}}function iu(i){const t={accel:1,maxSpeed:1,boostSpeed:1,steerRate:1,grip:1,driftGrip:1,brakeForce:1,boostDrain:1};for(const e of Object.keys(i)){const n=di(i[e]??zn(e));if(n.category===e)for(const s of Object.keys(n.stats)){const r=n.stats[s];typeof r=="number"&&(t[s]*=r)}}return t}const Ar={masterVolume:.8,bgmVolume:.7,sfxVolume:.85,quality:"high",difficulty:"normal",autoThrottle:!1,assistSteer:!0,laps:3,reducedMotion:!1,cameraDistance:"mid"},Cr={coins:0,coinsEarned:0,paints:["nova"],cars:["nova"],parts:["tire-street","rim-star","spoiler-wing","exhaust-twin","engine-stock","turbo-none","susp-stock","brake-stock"],carLoadout:{},tracks:["neon-loop"],cups:["classic"],hardDifficulty:!1,bestLaps:{},stars:{},trophies:[],bestDrift:0,boostCount:0,cupFinishes:0,goldLaps:[],normalCupWins:0,races:0,wins:0,driftTotal:0,distance:0,challenges:{}},su={"neon-loop":9,"sunset-pier":6,"void-grid":6.3,"pop-burst":10.5,"monet-lily":8.3,"red-october":8.6,"sakura-dash":15.8,"neon-rain":9.2,"ink-wash":5.9,"pixel-rush":8,"minimal-clean":6.8},ru="neon-drift-v1";function bv(){try{const i=localStorage.getItem(ru);if(!i)return{settings:{...Ar},unlocks:structuredClone(Cr)};const t=JSON.parse(i);return{settings:{...Ar,...t.settings??{}},unlocks:{...structuredClone(Cr),...t.unlocks??{}}}}catch{return{settings:{...Ar},unlocks:structuredClone(Cr)}}}function Gn(i){try{localStorage.setItem(ru,JSON.stringify(i))}catch{}}function wv(){const i={settings:{...Ar},unlocks:structuredClone(Cr)};return Gn(i),i}function Vc(i,t){return i.paints.includes(t)||t==="nova"}function Hc(i,t){return i.tracks.includes(t)||t==="neon-loop"}function Wc(i,t){return i.cars.includes(t)||t==="nova"}function Xc(i,t){return i.cups.includes(t)||t==="classic"}function Ve(i,t){const e=structuredClone(i);if(t.type==="cup-finish"&&(e.cupFinishes+=1),t.type==="boost"&&(e.boostCount+=1),t.type==="coins"&&(e.coins+=Math.max(0,Math.round(t.amount)),e.coinsEarned+=Math.max(0,Math.round(t.amount))),t.type==="career"&&(e.races+=1,t.win&&(e.wins+=1),e.distance+=Math.max(0,Math.round(t.distance))),t.type==="gold-lap"){const n=e.bestLaps[t.trackId];(!(n>0)||t.bestLap<n)&&(e.bestLaps[t.trackId]=t.bestLap);const s=su[t.trackId];s&&t.bestLap<=s&&!e.goldLaps.includes(t.trackId)&&e.goldLaps.push(t.trackId)}if(t.type==="track-clear"){const n=Mv(t.trackId);n&&!e.tracks.includes(n)&&e.tracks.push(n),e.tracks.includes(t.trackId)||e.tracks.push(t.trackId)}if(t.type==="stars"){const n=e.stars[t.trackId]??0;t.stars>n&&(e.stars[t.trackId]=t.stars)}t.type==="drift-score"&&t.score>e.bestDrift&&(e.bestDrift=Math.round(t.score)),t.type==="cup-trophy"&&(e.trophies.includes(t.cupId)||e.trophies.push(t.cupId),e.cups.includes(t.cupId)||e.cups.push(t.cupId)),(t.type==="cup-win"||t.type==="cup-trophy")&&((t.difficulty==="normal"||t.difficulty==="hard")&&(e.normalCupWins+=1),t.type==="cup-win"&&(e.hardDifficulty=!0)),t.type==="race-win"&&(e.hardDifficulty=!0);for(const n of Object.keys(e.bestLaps))e.tracks.includes(n)||e.tracks.push(n);return e.cupFinishes>=1&&!e.paints.includes("pixel")&&e.paints.push("pixel"),e.boostCount>=15&&!e.paints.includes("yuzu")&&e.paints.push("yuzu"),(e.normalCupWins>=1||e.goldLaps.includes("sunset-pier"))&&!e.paints.includes("blush")&&e.paints.push("blush"),e}function Ev(i,t,e){if(i.cars.includes(t)||i.coins<e)return null;const n=structuredClone(i);return n.coins-=e,n.cars.includes(t)||n.cars.push(t),n}function Tv(i,t,e){if(i.parts.includes(t)||i.coins<e)return null;const n=structuredClone(i);return n.coins-=e,n.parts.includes(t)||n.parts.push(t),n}function al(i,t){const e=i.carLoadout[t];return{...nu(),...e??{}}}function Av(i,t,e,n){const s=di(n);if(s.category!==e||!i.parts.includes(n)&&s.price>0)return null;const r=structuredClone(i);return r.carLoadout[t]={...al(r,t),[e]:n},r}function Cv(i,t,e){const n=al(i,e);return Object.values(n).includes(t)}function Rv(i){return i==="low"?{maxDpr:1,shadows:!1,bloom:!1}:i==="medium"?{maxDpr:1.5,shadows:!0,bloom:!0}:{maxDpr:2,shadows:!0,bloom:!0}}function ol(i){const t=JSON.stringify(es(i).controlPoints);let e=0;for(let n=0;n<t.length;n+=1)e=Math.imul(e,31)+t.charCodeAt(n)|0;return`neon-drift-ghost-${i}-${(e>>>0).toString(36).slice(0,6)}`}function $c(i){return Kh[i]}const Rr=10;class Pv{samples=[];acc=0;recording=!1;start(){this.samples=[],this.acc=0,this.recording=!0}stop(){this.recording=!1}tick(t,e){if(this.recording){for(this.acc+=t;this.acc>=1/Rr;)this.acc-=1/Rr,this.samples.push(Math.round(e.position.x*100)/100,Math.round(e.position.z*100)/100,Math.round(e.heading*1e3)/1e3);e.lapTime}}maybeSave(t,e,n){if(this.samples.length<10)return!1;const s=su[t],r=ol(t);let a=null;try{const c=localStorage.getItem(r);c&&(a=JSON.parse(c))}catch{}if(!(!a||e<a.seconds)||s&&e>s*3)return!1;const l={dt:1/Rr,samples:this.samples.map(c=>Math.round(c*100)/100),seconds:e,body:n};try{return localStorage.setItem(r,JSON.stringify(l)),!0}catch{return!1}}}class Lv{group=new ge;data=null;active=!1;loadFor(t,e){try{const n=localStorage.getItem(ol(t));if(!n)return this.active=!1,this.group.visible=!1,!1;this.data=JSON.parse(n)}catch{return this.active=!1,!1}return this.buildSilhouette(this.data.body??e),this.active=!0,!0}clear(){this.active=!1,this.group.visible=!1}buildSilhouette(t){this.group.clear();const e=Jh(t,$c(t)),n=vn("ghost-body",()=>new Oe({color:"#8ff6ff",transparent:!0,opacity:.5,depthWrite:!1,side:xe})),s=new Tt(e,n);this.group.add(s);const r=new Tt(jh(t,$c(t)),n);this.group.add(r),this.group.visible=!0}update(t){if(!this.active||!this.data)return;this.group.visible=!0;const{samples:e}=this.data,n=e.length/3;if(n<2)return;const s=Math.max(0,t)*Rr,r=Math.min(Math.floor(s),n-2),a=Math.min(1,s-r),o=e[r*3],l=e[r*3+1],c=e[r*3+2],h=e[(r+1)*3],u=e[(r+1)*3+1],d=e[(r+1)*3+2];this.group.position.set(o+(h-o)*a,0,l+(u-l)*a);let f=d-c;for(;f>Math.PI;)f-=Math.PI*2;for(;f<-Math.PI;)f+=Math.PI*2;this.group.rotation.y=c+f*a}}class Iv{speedEl=this.get("#hud-speed");boostFill=this.get("#hud-boost-fill");lapEl=this.get("#hud-lap");posEl=this.get("#hud-pos");timeEl=this.get("#hud-time");lapTimeEl=this.get("#hud-lap-time");bestEl=this.get("#hud-best");messageEl=this.get("#hud-message");countdownEl=this.get("#hud-countdown");standingsEl=this.get("#hud-standings");driftEl=this.get("#hud-drift");finishEl=this.get("#hud-finish");finishTitle=this.get("#hud-finish-title");finishDetail=this.get("#hud-finish-detail");lastMessage="";tickTimer=0;flashCountdown(){this.lastMessage=""}flashDrift(t,e){this.driftEl.textContent=`MINI-TURBO ×${t}${e===2?" !":""}`,this.driftEl.classList.remove("on"),this.driftEl.offsetWidth,this.driftEl.classList.add("on","turbo"),window.setTimeout(()=>{this.driftEl.classList.remove("turbo"),this.driftEl.textContent="DRIFT"},900)}update(t){if(this.speedEl.textContent=String(Math.round(t.speedKph)).padStart(3,"0"),this.boostFill.style.width=`${Math.round(t.boost*100)}%`,this.boostFill.classList.toggle("hot",t.boost>.85),this.lapEl.textContent=`${t.lap}/${t.totalLaps}`,this.posEl.textContent=`${t.position}/${t.fieldSize}`,this.timeEl.textContent=_s(t.raceTime),this.lapTimeEl.textContent=_s(t.currentLapTime),this.bestEl.textContent=t.bestLap>0?_s(t.bestLap):"--:--.--",this.driftEl.classList.toggle("on",t.drifting),t.phase==="countdown"){this.countdownEl.hidden=!1;const e=t.countdown>0?String(t.countdown):"GO";this.countdownEl.textContent!==e&&(this.countdownEl.textContent=e,this.countdownEl.classList.remove("tick"),this.countdownEl.offsetWidth,this.countdownEl.classList.add("tick")),this.countdownEl.classList.toggle("go",t.countdown<=0),this.countdownEl.classList.contains("tick")&&(window.clearTimeout(this.tickTimer),this.tickTimer=window.setTimeout(()=>this.countdownEl.classList.remove("tick"),950))}else this.countdownEl.hidden=!0;t.message&&t.message!==this.lastMessage?(this.messageEl.textContent=t.message,this.messageEl.classList.remove("show"),this.messageEl.offsetWidth,this.messageEl.classList.add("show"),this.lastMessage=t.message,window.setTimeout(()=>this.messageEl.classList.remove("show"),1600)):t.message||(this.lastMessage=""),this.standingsEl.innerHTML=t.standings.map((e,n)=>`<li class="${e.isPlayer?"you":""}"><span class="p">${n+1}</span><span class="c" style="background:${e.paint}"></span><span class="n">${Uv(e.name)}</span><span class="l">L${Math.max(1,Math.min(e.lap+1,t.totalLaps))}</span></li>`).join(""),t.phase==="finished"?(this.finishEl.hidden=!1,this.finishTitle.textContent=t.position===1?"FIRST!":`${Dv(t.position)} PLACE`,this.finishDetail.textContent=`Best ${_s(t.bestLap)} · Race ${_s(t.raceTime)} · R to rematch`):this.finishEl.hidden=!0}get(t){const e=document.querySelector(t);if(!e)throw new Error(`Missing HUD element: ${t}`);return e}}function _s(i){if(!Number.isFinite(i)||i<0)return"--:--.--";const t=Math.floor(i/60),e=i%60;return`${String(t).padStart(2,"0")}:${e.toFixed(2).padStart(5,"0")}`}function Dv(i){return{1:"1ST",2:"2ND",3:"3RD",4:"4TH"}[i]??`${i}TH`}function Uv(i){return i.replace(/[&<>"']/g,t=>`&#${t.charCodeAt(0)};`)}function qn(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}const Nv={easy:{tierRatio:.9,cornerFloor:.03,straightCap:31*He,boostSpeed:41*He,accel:22*He,cornerGrip:.78,brakeDecel:20*He,mistakeRate:.16,bandUp:.28,bandDown:.7,bandWindow:.1,mercyFloor:.12,launchMin:.32,launchVar:.45},normal:{tierRatio:1.08,cornerFloor:.075,straightCap:35.5*He,boostSpeed:46.5*He,accel:26.5*He,cornerGrip:.9,brakeDecel:24*He,mistakeRate:.08,bandUp:.33,bandDown:.64,bandWindow:.1,mercyFloor:.3,launchMin:.14,launchVar:.27},hard:{tierRatio:1.18,cornerFloor:.1,straightCap:37*He,boostSpeed:48*He,accel:28*He,cornerGrip:.94,brakeDecel:25*He,mistakeRate:.05,bandUp:.35,bandDown:.62,bandWindow:.1,mercyFloor:.45,launchMin:.06,launchVar:.18}},Fv=Nv,qc=[{cornerGripMul:1.04,mistakeMul:.7,noiseAmp:.5,boostBias:.85},{cornerGripMul:.98,mistakeMul:1,noiseAmp:.8,boostBias:1.1},{cornerGripMul:.95,mistakeMul:1.6,noiseAmp:1.2,boostBias:.7}];class Yc{constructor(t,e,n=3,s="normal"){this.track=t,this.cars=e,this.totalLaps=n,this.preset=Fv[s];const r=qn(9176+s.length*331);e.forEach((a,o)=>{if(a.isPlayer){this.playerCar=a;return}const l=qc[(o-1)%qc.length];this.personalities.set(a.index,{cornerGrip:this.preset.cornerGrip*l.cornerGripMul,mistakeRate:this.preset.mistakeRate*l.mistakeMul,lineNoiseAmp:l.noiseAmp,noisePhase:r()*Math.PI*2,boostBias:l.boostBias,launchDelay:0,inCorner:!1,mistakeActive:!1,overtake:0,paceBand:1,debug:{corner:0,cap:0,band:1,target:0,brake:!1,pace:0}});const c={...sl,accel:this.preset.accel,maxSpeed:this.preset.straightCap*1.08,boostSpeed:this.preset.boostSpeed*1.12};a.setTuning(c)}),this.assignLaunchDelays()}phase="countdown";totalLaps=3;countdown=3.5;raceTime=0;timeTrial=!1;onCountdownBeep=null;onGo=null;message="";messageTimer=0;preset;personalities=new Map;playerCar=null;rng=qn(20261112);assignLaunchDelays(){this.rng=qn(20261112);for(const[t,e]of this.personalities)e.launchDelay=this.preset.launchMin+this.rng()*this.preset.launchVar}reset(){this.phase="countdown",this.countdown=3.5,this.raceTime=0,this.message="",this.messageTimer=0,this.assignLaunchDelays();for(const[,t]of this.personalities)t.inCorner=!1,t.mistakeActive=!1,t.overtake=0,t.paceBand=1;for(const t of this.cars)t.resetProgress()}setTimeTrial(t){this.timeTrial=t}update(t){if(this.phase==="finished")for(const e of this.cars)e.controls.throttle=Math.max(0,e.controls.throttle-t*1.2),e.controls.boost=!1,e.controls.drift=!1;if(this.phase==="countdown"){const e=Math.ceil(this.countdown);this.countdown-=t;const n=Math.ceil(this.countdown);n<e&&n>0&&this.onCountdownBeep?.(),this.countdown<=0&&(this.phase="racing",this.countdown=0,this.flashMessage("GO!"),this.onGo?.())}else if(this.phase==="racing"&&(this.raceTime+=t,this.driveAI(t),this.applySlipstream(t),this.cars.filter(e=>e.isPlayer).every(e=>e.lap>=this.totalLaps))){this.phase="finished";const e=this.cars.find(s=>s.isPlayer),n=this.getStandings().findIndex(s=>s.isPlayer)+1;this.flashMessage(this.timeTrial?`FINISH · ${kv(e?.lastLap??0)}`:n===1?"FINISH · 1st!":`FINISH · ${Ov(n)}`),e&&(e.finished=!0);for(const s of this.cars)s.finished=!0}this.messageTimer>0&&(this.messageTimer-=t,this.messageTimer<=0&&(this.message=""));for(let e=0;e<this.cars.length;e+=1)for(let n=e+1;n<this.cars.length;n+=1)this.cars[e].resolveCarCollision(this.cars[n]);return this.getState()}bandFor(t,e,n){if(!this.playerCar||this.playerCar===t)return 1;const s=this.playerCar.unwrappedProgress-t.unwrappedProgress;let r=this.preset.tierRatio;return s>.04?r*=1+Math.min(.14,(s-.04)*1.6):s<-.01&&(r*=1-Math.min(.22,(-s-.01)*2.2)),n.paceBand+=(r-n.paceBand)*Math.min(1,e*1.2),1/(He*n.cornerGrip)*Math.max(n.paceBand,.55)}driveAI(t){const e=this.track;for(const n of this.cars){const s=this.personalities.get(n.index);if(!s||n.isPlayer||n.finished)continue;const r=this.bandFor(n,t,s),a=new A(Math.sin(n.heading),0,Math.cos(n.heading)),o=new A(a.z,0,-a.x),l=n.velocity.dot(a),c=n.trackU;if(this.raceTime<s.launchDelay){n.controls.throttle=.35,n.controls.steer*=.6,n.controls.brake=!1,n.controls.drift=!1,n.controls.boost=!1;continue}const h=e.aiBrakeSpeedProfile(this.preset.brakeDecel),u=(c%1+1)%1*e.segmentCount,d=Math.floor(u)%e.segmentCount,f=u-Math.floor(u),p=(d+1)%e.segmentCount,x=h[d]+(h[p]-h[d])*f;let g=x*s.cornerGrip;const m=Math.abs(e.curvatureAtU(c)),v=m>e.length/70;v&&!s.inCorner&&(s.mistakeActive=this.rng()<s.mistakeRate),s.inCorner=v,v||(s.mistakeActive=!1),s.mistakeActive&&(g*=.86);const S=n.controls.boost&&n.boost>.02&&n.controls.throttle>.1?this.preset.boostSpeed:this.preset.straightCap,R=Math.min(g,S)*r,E=R-l;let P=ke.clamp(E*.35,-.4,1);const y=l>R*1.1,T=ke.clamp(l/e.length*1.2,.014,.05),I=(c+T+1)%1,C=Math.sin(this.raceTime*.6+s.noisePhase)*s.lineNoiseAmp;let N=e.lineLateralAt(I)+C+s.overtake;N=ke.clamp(N,-(e.roadHalfWidth-1.2),e.roadHalfWidth-1.2);const W=e.pointAt(I,N).sub(n.position);let B=Math.atan2(W.x,W.z)-n.heading;for(;B>Math.PI;)B-=Math.PI*2;for(;B<-Math.PI;)B+=Math.PI*2;const k=ke.clamp(-B*2.4,-1,1);let J=0,et=1,dt=!1;for(const Bt of this.cars){if(Bt===n)continue;const Y=Bt.position.clone().sub(n.position),pt=Y.dot(a);if(pt<=0||pt>9)continue;const it=Y.dot(o);if(Math.abs(it)<2.6){const Ct=it>0?-1:1,Ft=e.roadHalfWidth-1.6;J=ke.clamp(e.lineLateralAt(I)+Ct*3.4,-Ft,Ft)-e.lineLateralAt(I),dt=!0,pt<3.5&&Math.abs(it)<1.4&&Bt.speed<l+2&&(et=.7)}}s.overtake+=(J-s.overtake)*.15;const yt=g>=S*.98,At=this.playerCar?this.playerCar.unwrappedProgress-n.unwrappedProgress>-.02:!0,$t=.3*s.boostBias,ie=n.boost>$t&&Math.abs(B)<.25&&(yt&&At||dt&&n.boost>.45);n.controls.throttle=P*et,n.controls.brake=y,n.controls.steer=k,n.controls.drift=!s.mistakeActive&&l>22*He&&e.length/Math.max(m,1e-4)<55&&Math.abs(B)>.05,n.controls.boost=ie,s.debug={corner:Math.round(g),cap:Math.round(S),band:Number(r.toFixed(3)),target:Math.round(R),brake:y,pace:Math.round(x)}}}applySlipstream(t){for(const e of this.cars){if(e.finished||e.speed<14)continue;const n=new A(Math.sin(e.heading),0,Math.cos(e.heading));for(const s of this.cars){if(s===e)continue;const r=s.position.clone().sub(e.position),a=r.dot(n);if(!(a<=.5||a>11||Math.abs(r.dot(new A(n.z,0,-n.x)))>2.2)){e.velocity.addScaledVector(n,3.4*(1-a/11)*t);break}}}}getStandings(){return this.cars.map(t=>({index:t.index,name:t.paint.name,isPlayer:t.isPlayer,lap:t.lap,progress:t.unwrappedProgress,finished:t.finished,bestLap:t.bestLap,paint:t.paint.body})).sort((t,e)=>{if(t.finished!==e.finished)return t.finished?-1:1;const n=Math.round(t.progress*1e3);return Math.round(e.progress*1e3)-n||t.index-e.index}).map((t,e)=>({...t,position:e+1}))}getState(){const t=this.cars.find(s=>s.isPlayer),e=this.getStandings(),n=e.findIndex(s=>s.isPlayer)+1;return{phase:this.phase,countdown:Math.max(0,Math.ceil(this.countdown-.5)),totalLaps:this.totalLaps,raceTime:this.raceTime,playerLap:Math.max(1,Math.min(t.lap+1,this.totalLaps)),playerPosition:n,standings:e,playerBestLap:t.bestLap,playerLastLap:t.lastLap,message:this.message}}flashMessage(t,e=2){this.message=t,this.messageTimer=e}getAiDebug(){return this.cars.filter(t=>!t.isPlayer).map(t=>({index:t.index,speed:t.speed,u:t.trackU,lap:t.lap,dbg:this.personalities.get(t.index)?.debug??{corner:0,cap:0,band:1,target:0,brake:!1,pace:0}}))}}function Ov(i){return i===1?"1st":i===2?"2nd":i===3?"3rd":`${i}th`}function kv(i){return`${i.toFixed(2)}s`}const Bv=[{id:"day",nameZh:"白天",icon:"☀"},{id:"dusk",nameZh:"黄昏",icon:"🌇"},{id:"night",nameZh:"夜幕",icon:"🌙"},{id:"rain",nameZh:"雨天",icon:"🌧"}],zv={top:"#080614"},Da={bottom:"#3a1c48",mid:"#ff8a5c",top:"#2a1a5c"};function Io(i){const t=i.replace("#",""),e=t.length===3?t.split("").map(s=>s+s).join(""):t.slice(0,6),n=parseInt(e,16);return[n>>16&255,n>>8&255,n&255]}function au(i,t,e){const n=s=>Math.max(0,Math.min(255,Math.round(s))).toString(16).padStart(2,"0");return`#${n(i)}${n(t)}${n(e)}`}function Je(i,t){const[e,n,s]=Io(i);return au(e*t,n*t,s*t)}function Bn(i,t,e){const[n,s,r]=Io(i),[a,o,l]=Io(t);return au(n+(a-n)*e,s+(o-s)*e,r+(l-r)*e)}const Gv=["vapor","pier","void","rain","pixel","soviet","minimal"];function Vv(i,t){return t==="rain"?Gv.includes(i):!0}function Hv(i,t){if(t==="day")return i;const e=structuredClone(i.theme),n=e.sky;return t==="dusk"&&(n.bottom=Bn(n.bottom,Da.bottom,.55),n.mid=Bn(n.mid,Da.mid,.5),n.top=Bn(n.top,Da.top,.55),e.fog=Bn(e.fog,"#6b3a52",.45),e.keyColor="#ffd0a8",e.keyIntensity=Math.min(2.8,e.keyIntensity+.15),e.skyLight=Bn(e.skyLight,"#ffb27a",.5),(n.kind==="strokes"||n.kind==="ink")&&(n.bottom=Bn(n.bottom,"#f5b896",.4),n.mid=Bn(n.mid,"#e88a6a",.45))),t==="night"&&(n.bottom=Je(n.bottom,.32),n.mid=Je(n.mid,.4),n.top=Bn(Je(n.top,.35),zv.top,.4),e.fog=Je(e.fog,.4),e.fogDensity=e.fogDensity*1.12,e.ground.base=Je(e.ground.base,.45),e.groundBounce=Je(e.groundBounce,.5),e.keyColor="#b8c8ff",e.keyIntensity=Math.max(1.2,e.keyIntensity*.7),e.skyLight=Je(e.skyLight,.55),e.roadBase=Je(e.roadBase,.6),(n.kind==="plain"||n.kind==="pixel")&&(n.kind="stars")),t==="rain"&&(e.fog=Bn(e.fog,"#8a94a8",.4),e.fogDensity=e.fogDensity*1.3,e.ground.base=Je(e.ground.base,.55),e.ground.pattern="wet",e.roadBase=Je(e.roadBase,.72),e.keyColor="#cfd8e8",e.keyIntensity=Math.max(1,e.keyIntensity*.75),e.skyLight=Je(e.skyLight,.7),n.bottom=Je(n.bottom,.6),n.mid=Je(n.mid,.62),n.top=Je(n.top,.6),e.rain=!0,n.kind==="sunburst"&&(n.kind="clouds"),(n.kind==="strokes"||n.kind==="ink")&&(n.kind="clouds")),{...i,theme:e,nameZh:i.nameZh,blurb:i.blurb}}const Do=[{id:"first-win",nameZh:"初次登顶",desc:"在任意比赛中获得第一名",icon:"🥇",check:i=>i.wins>=1,progress:i=>Math.min(1,i.wins)},{id:"wins-10",nameZh:"常胜将军",desc:"累计获胜 10 场",icon:"🎖",check:i=>i.wins>=10,progress:i=>Math.min(1,i.wins/10)},{id:"races-25",nameZh:"赛场老手",desc:"完成 25 场比赛",icon:"🏁",check:i=>i.races>=25,progress:i=>Math.min(1,i.races/25)},{id:"all-tracks",nameZh:"全图通",desc:"解锁全部 11 条赛道",icon:"🗺",check:i=>i.tracks.length>=hn.length,progress:i=>i.tracks.length/hn.length},{id:"star-any3",nameZh:"完美一圈",desc:"任意赛道取得三星评价",icon:"⭐",check:i=>Object.values(i.stars).some(t=>t>=3),progress:i=>Object.values(i.stars).some(t=>t>=3)?1:0},{id:"stars-15",nameZh:"星级收藏家",desc:"累计获得 15 颗星",icon:"✨",check:i=>Object.values(i.stars).reduce((t,e)=>t+e,0)>=15,progress:i=>Math.min(1,Object.values(i.stars).reduce((t,e)=>t+e,0)/15)},{id:"gold-5",nameZh:"金圈猎人",desc:"取得 5 个金圈",icon:"🟡",check:i=>i.goldLaps.length>=5,progress:i=>Math.min(1,i.goldLaps.length/5)},{id:"trophy-first",nameZh:"杯赛冠军",desc:"赢下任意杯赛",icon:"🏆",check:i=>i.trophies.length>=1,progress:i=>Math.min(1,i.trophies.length)},{id:"trophy-all",nameZh:"全冠王朝",desc:"赢下全部 4 个杯赛的冠军",icon:"👑",check:i=>i.trophies.length>=4,progress:i=>Math.min(1,i.trophies.length/4)},{id:"drift-10000",nameZh:"漂移大师",desc:"单场漂移分达到 10000",icon:"🌀",check:i=>i.bestDrift>=1e4,progress:i=>Math.min(1,i.bestDrift/1e4)},{id:"nitro-100",nameZh:"氮气成瘾",desc:"累计使用氮气 100 次",icon:"💨",check:i=>i.boostCount>=100,progress:i=>Math.min(1,i.boostCount/100)},{id:"coins-5000",nameZh:"小有积蓄",desc:"生涯累计赚取 5000 金币",icon:"💰",check:i=>i.coinsEarned>=5e3,progress:i=>Math.min(1,i.coinsEarned/5e3)},{id:"challenge-first",nameZh:"每日打卡",desc:"完成一次每日挑战",icon:"📅",check:i=>Object.values(i.challenges).some(t=>t.done),progress:i=>Object.values(i.challenges).some(t=>t.done)?1:0},{id:"garage-full",nameZh:"全车收藏",desc:"拥有全部 7 台车",icon:"🚗",check:i=>i.cars.length>=7,progress:i=>Math.min(1,i.cars.length/7)}];function Wv(i){const t=new Set;for(const e of Do)e.check(i)&&t.add(e.id);return t}const Br=[{id:"nova",nameZh:"新星轿跑",nameEn:"NOVA GT",body:"coupe",blurb:"初始座驾，什么都会一点",stats:{accel:1,maxSpeed:1,boostSpeed:1,steer:1},price:0},{id:"dash",nameZh:"像素跃动",nameEn:"DASH HATCH",body:"hatch",blurb:"短小灵活，转向和起步更敏捷",stats:{accel:1.08,maxSpeed:.98,boostSpeed:1.02,steer:1.15},price:600},{id:"brute",nameZh:"蛮牛肌肉",nameEn:"BRUTE MUSCLE",body:"muscle",blurb:"直线猛兽，加速与极速大幅提升",stats:{accel:1.18,maxSpeed:1.08,boostSpeed:1.04,steer:.9},price:1400},{id:"cruiser",nameZh:"经典流线",nameEn:"CRUISER 64",body:"cruiser",blurb:"豪华巡航，极速与氮气双高",stats:{accel:1,maxSpeed:1.14,boostSpeed:1.12,steer:.96},price:2600},{id:"proto",nameZh:"量子原型",nameEn:"PROTO HOVER",body:"hover",blurb:"悬浮旗舰，氮气就是一切",stats:{accel:1.08,maxSpeed:1.08,boostSpeed:1.22,steer:1.05},price:4200},{id:"roadster",nameZh:"敞篷浪客",nameEn:"ROADSTER R",body:"roadster",blurb:"敞篷轻量，转向如手术刀",stats:{accel:1.12,maxSpeed:1.04,boostSpeed:1.06,steer:1.18},price:6800},{id:"formula",nameZh:"方程式零号",nameEn:"FORMULA 0",body:"formula",blurb:"开轮赛车，空气动力学极限",stats:{accel:1.2,maxSpeed:1.12,boostSpeed:1.18,steer:1.22},price:9800}];function zs(i){return Br.find(t=>t.id===i)??Br[0]}function Xv(i,t,e){const n=iu(e??nu());return{...t,accel:t.accel*i.stats.accel*(n.accel??1),maxSpeed:t.maxSpeed*i.stats.maxSpeed*(n.maxSpeed??1),boostSpeed:t.boostSpeed*i.stats.boostSpeed*(n.boostSpeed??1),steerRate:t.steerRate*i.stats.steer*(n.steerRate??1),grip:t.grip*(n.grip??1),driftGrip:t.driftGrip*(n.driftGrip??1),brakeForce:t.brakeForce*(n.brakeForce??1),boostDrain:t.boostDrain*(n.boostDrain??1)}}function $v(i){let t=2166136261;for(let e=0;e<i.length;e+=1)t^=i.charCodeAt(e),t=Math.imul(t,16777619);return t>>>0}function Vn(){const i=new Date,t=String(i.getMonth()+1).padStart(2,"0"),e=String(i.getDate()).padStart(2,"0");return`${i.getFullYear()}-${t}-${e}`}function Zc(i){const t=$v("nd-challenge-"+i),e=hn[t%hn.length],n=["day","dusk","night"],s=n[(t>>>8)%n.length];return{dateKey:i,trackId:e.id,variant:s,difficulty:"normal",laps:3,targetLap:Math.round(qv(e.id)*1.06*10)/10}}function qv(i){return tu[i]??9}function ou(i,t){const e=`${i}|${t.toFixed(2)}`;return btoa(e).replace(/=+$/,"")}function Yv(i){try{const t=atob(i.trim()),[e,n]=t.split("|"),s=Number(n);return!/^\d{4}-\d{2}-\d{2}$/.test(e??"")||!Number.isFinite(s)||s<=0?null:{dateKey:e,bestLap:s}}catch{return null}}class Zv{constructor(t,e){this.app=t,this.handlers=e;const n=document.querySelector("#ui-shell");if(!n)throw new Error("Missing #ui-shell");this.root=n,this.render()}root;partCat="tire";showScreen(t){if(t==="race"){this.root.innerHTML="";return}this.render()}render(){const t=this.app.screen;if(t==="race"){this.root.innerHTML="";return}if(t==="settings"){this.root.innerHTML=this.settingsHtml(),this.bindSettings();return}if(t==="paint"){this.root.innerHTML=this.paintHtml(),this.bindPaint();return}if(t==="garage"){this.root.innerHTML=this.garageHtml(),this.bindGarage();return}if(t==="trophies"){this.root.innerHTML=this.trophiesHtml(),this.bindTrophies();return}if(t==="challenge"){this.root.innerHTML=this.challengeHtml(),this.bindChallenge();return}if(t==="cup-select"){this.root.innerHTML=this.cupSelectHtml(),this.bindCupSelect();return}if(t==="track"){this.root.innerHTML=this.trackHtml(),this.bindTrack();return}if(t==="mode"){this.root.innerHTML=this.modeHtml(),this.bindMode();return}if(t==="pause"){this.root.innerHTML=this.pauseHtml(),this.bindPause();return}if(t==="results"){this.root.innerHTML=this.resultsHtml(),this.bindResults();return}if(t==="cup-standings"){this.root.innerHTML=this.cupHtml(),this.bindCup();return}this.root.innerHTML=this.menuHtml(),this.bindMenu()}stars(t){return"★".repeat(t)+"☆".repeat(Math.max(0,3-t))}menuHtml(){const t=this.app.unlocks;return`
      <section class="screen" data-screen="menu">
        <p class="kicker">11 TRACKS · 8 STYLES · MIRROR AI</p>
        <h1>NEON DRIFT GP</h1>
        <p class="sub">霓虹漂移大奖赛 · 11 赛道八种风格竞速</p>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="primary">开始比赛</button>
          <button class="neon-btn" data-act="cup">杯赛</button>
          <button class="neon-btn" data-act="challenge">每日挑战</button>
          <button class="neon-btn" data-act="garage">车库</button>
          <button class="neon-btn" data-act="trophies">成就室</button>
          <button class="neon-btn" data-act="settings">设置</button>
        </div>
        <p class="sub">WASD 驾驶 · Space 漂移 · Shift 氮气 · C 镜头 · R 重开 · Esc 菜单</p>
        <p class="sub tiny">💰 ${t.coins} 金币 · 🏆 ${t.trophies.length}/4 · ⭐ ${Object.values(t.stars).reduce((e,n)=>e+n,0)}/33 · 漂移分 ${t.bestDrift}</p>
      </section>
    `}modeHtml(){return`
      <section class="screen" data-screen="mode">
        <p class="kicker">SELECT MODE</p>
        <h2>选择模式</h2>
        <div class="mode-row">
          ${[{id:"race",title:"竞速",sub:"玩家 + 3 AI · 自选赛道"},{id:"time-trial",title:"计时",sub:"单人刷圈速 · 幽灵车"},{id:"cup",title:"杯赛",sub:"多站积分 · 争夺奖杯"}].map(e=>`<button class="choice ${this.app.mode===e.id?"selected":""}" data-mode="${e.id}">${e.title}<small>${e.sub}</small></button>`).join("")}
        </div>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="primary">下一步</button>
          <button class="neon-btn ghost" data-act="back">返回</button>
        </div>
      </section>
    `}cupSelectHtml(){return`
      <section class="screen wide" data-screen="cup-select">
        <p class="kicker">SELECT CUP</p>
        <h2>选择杯赛</h2>
        <div class="cup-row">
          ${this.app.availableCups().map(e=>`
              <button class="choice cup-card ${e.unlocked?"":"locked"}" data-cup="${e.cup.id}" ${e.unlocked?"":"disabled"}>
                <strong>${e.cup.nameZh} · ${e.cup.nameEn}</strong>
                <small>${e.won?"🏆 已夺冠":"未夺冠"}</small>
                <small>${e.cup.legs.map(n=>this.shortName(n)).join(" → ")}</small>
              </button>`).join("")}
        </div>
        <div class="btn-col">
          <button class="neon-btn ghost" data-act="back">返回</button>
        </div>
      </section>
    `}shortName(t){return{"neon-loop":"霓虹","sunset-pier":"栈桥","void-grid":"虚空","pop-burst":"波普","monet-lily":"睡莲","red-october":"十月","sakura-dash":"樱花","neon-rain":"雨夜","ink-wash":"水墨","pixel-rush":"像素","minimal-clean":"极简"}[t]??t}trackHtml(){const t=this.app.availableTracks(),e=Bv.filter(n=>Vv(this.app.track.theme.style,n.id));return`
      <section class="screen" data-screen="track">
        <p class="kicker">SELECT TRACK</p>
        <h2>选择赛道</h2>
        <div class="track-row wrap">
          ${t.map(n=>`<button class="choice ${this.app.trackId===n.def.id?"selected":""}" data-track="${n.def.id}" ${n.unlocked?"":"disabled"}>
                  ${n.def.nameZh} · ${n.def.nameEn}
                  <small>${n.unlocked?`${n.def.styleLabelZh} · ${n.def.blurb}`:"未解锁"}</small>
                </button>`).join("")}
        </div>
        <div class="variant-row">
          ${e.map(n=>`<button class="variant ${this.app.variant===n.id?"selected":""}" data-variant="${n.id}">${n.icon} ${n.nameZh}</button>`).join("")}
        </div>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="primary">下一步</button>
          <button class="neon-btn ghost" data-act="back">返回</button>
        </div>
      </section>
    `}paintHtml(){return`
      <section class="screen" data-screen="paint">
        <p class="kicker">SELECT PAINT & CAR</p>
        <h2>涂装与车辆</h2>
        <div class="paint-row">
          ${this.app.availablePaints().map(e=>`<button class="choice ${this.app.paintId===e.paint.id?"selected":""}" data-paint="${e.paint.id}" ${e.unlocked?"":"disabled"}>
                  <div class="paint-swatch" style="background:linear-gradient(90deg,${e.paint.body},${e.paint.accent})"></div>
                  ${e.paint.name}
                  <small>${e.unlocked?"已解锁":e.paint.unlockHint}</small>
                </button>`).join("")}
        </div>
        <div class="paint-row">
          ${this.app.availableCars().map(e=>`<button class="choice ${this.app.carId===e.car.id?"selected":""}" data-car="${e.car.id}" ${e.unlocked?"":"disabled"}>
                  ${e.car.nameZh}
                  <small>${e.unlocked?e.car.nameEn+" · "+e.car.blurb:"未解锁"}</small>
                </button>`).join("")}
        </div>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="primary">开赛</button>
          <button class="neon-btn ghost" data-act="back">返回</button>
        </div>
      </section>
    `}garageHtml(){const t=this.app.availableCars(),e=this.app.unlocks.coins,n=zs(this.app.carId),s=this.app.loadoutFor(this.app.carId),r=iu(s),a=l=>Math.round((l-.82)/.42*100),o=Bs.filter(l=>l.category===this.partCat);return`
      <section class="screen wide" data-screen="garage">
        <p class="kicker">GARAGE</p>
        <h2>车库</h2>
        <p class="sub tiny">金币余额 <strong style="color:var(--yellow)">💰 ${e}</strong> · 完赛/星级/每日挑战赚金币 · 改装让更快的难度变简单</p>
        <div class="garage-row">
          ${t.map(l=>{const c=l.unlocked,h=e>=l.car.price,u=c?this.app.carId===l.car.id?'<span class="own-tag">当前用车</span>':'<span class="own-tag">已拥有 · 点击选用</span>':`<span class="price-tag ${h?"can":"cant"}">🏷 ${l.car.price} 金币${h?"":`（还差 ${l.car.price-e}）`}</span>`;return`
              <button class="choice garage-card ${this.app.carId===l.car.id?"selected":""}" data-car="${l.car.id}" data-buy="${c?"no":h?"yes":"no"}">
                <strong>${l.car.nameZh} · ${l.car.nameEn}</strong>
                <small>${l.car.blurb}</small>
                <div class="stat-rows">
                  ${bn("加速",a(l.car.stats.accel))}
                  ${bn("极速",a(l.car.stats.maxSpeed))}
                  ${bn("氮气",a(l.car.stats.boostSpeed))}
                  ${bn("转向",a(l.car.stats.steer))}
                </div>
                ${u}
              </button>`}).join("")}
        </div>
        <p class="kicker" style="margin-top:12px">PARTS SHOP · ${n.nameZh}</p>
        <div class="part-cats">
          ${Sv.map(l=>`<button class="chip ${this.partCat===l.id?"selected":""}" data-partcat="${l.id}">${l.nameZh}</button>`).join("")}
        </div>
        <div class="part-grid">
          ${o.map(l=>{const c=this.app.partOwned(l.id)||l.price===0,h=this.app.partEquippedOn(l.id,this.app.carId),u=Object.entries(l.stats).map(([f,p])=>`${Kv(f)}${p-1>=0?"+":""}${Math.round((p-1)*100)}%`).join(" "),d=h?'<span class="own-tag">已装备</span>':c?'<span class="own-tag">点击装备</span>':`<span class="price-tag ${e>=l.price?"can":"cant"}">🏷 ${l.price} 金币</span>`;return`
              <button class="choice part-card ${h?"selected":""}" data-part="${l.id}" data-cat="${l.category}">
                <strong>${l.name}</strong>
                <small>${l.desc}</small>
                <small class="stat-text">${u||"原厂标准"}</small>
                ${d}
              </button>`}).join("")}
        </div>
        <div class="stat-rows wide-stats">
          ${bn("加速",a(r.accel??1))}
          ${bn("极速",a(r.maxSpeed??1))}
          ${bn("氮气",a(r.boostSpeed??1))}
          ${bn("转向",a(r.steerRate??1))}
          ${bn("抓地",a(r.grip??1))}
          ${bn("漂移",a(r.driftGrip??1))}
        </div>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="back">返回</button>
        </div>
      </section>
    `}trophiesHtml(){const t=this.app.unlocks,e=this.app.albumProgress(),n={classic:"经典杯",art:"艺术杯",speed:"极速杯",future:"未来杯"},s=Wv(t),r=(t.distance/1e3).toFixed(1);return`
      <section class="screen wide" data-screen="trophies">
        <p class="kicker">TROPHY ROOM</p>
        <h2>成就室</h2>
        <div class="trophy-row">
          ${Object.entries(n).map(([a,o])=>`<div class="trophy ${t.trophies.includes(a)?"won":""}">${t.trophies.includes(a)?"🏆":"·"} ${o}</div>`).join("")}
        </div>
        <div class="career-grid">
          <div class="career-cell"><strong>${t.races}</strong><small>场比赛</small></div>
          <div class="career-cell"><strong>${t.wins}</strong><small>场胜利</small></div>
          <div class="career-cell"><strong>${r}km</strong><small>总里程</small></div>
          <div class="career-cell"><strong>${t.driftTotal}</strong><small>累计漂移分</small></div>
          <div class="career-cell"><strong>💰 ${t.coins}</strong><small>金币余额</small></div>
          <div class="career-cell"><strong>${s.size}/${Do.length}</strong><small>成就</small></div>
        </div>
        <div class="ach-grid">
          ${Do.map(a=>{const o=s.has(a.id),l=a.progress?Math.round(a.progress(t)*100):null;return`
            <div class="ach-card ${o?"done":""}">
              <span class="ach-icon">${a.icon}</span>
              <strong>${a.nameZh}</strong>
              <small>${a.desc}</small>
              ${!o&&l!==null?`<div class="stat-bar"><div style="width:${l}%"></div></div>`:""}
            </div>`}).join("")}
        </div>
        <p class="kicker" style="margin-top:10px">TRACK ALBUM</p>
        <div class="album-grid">
          ${e.map(a=>`
            <div class="album-card ${a.unlocked?"":"locked"}">
              <strong>${a.def.nameZh}</strong>
              <small>${a.def.styleLabelZh}</small>
              <span class="stars">${this.stars(a.stars)}</span>
              <small>${a.bestLap>0?`最佳 ${a.bestLap.toFixed(2)}s`:a.unlocked?"尚无圈速":"未解锁"}</small>
            </div>`).join("")}
        </div>
        <p class="sub tiny">幽灵存档随计时赛自动记录 · 金圈 ${t.goldLaps.length} · 氮气 ${t.boostCount} 次</p>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="back">返回</button>
        </div>
      </section>
    `}challengeHtml(){const t=Zc(Vn()),e=this.app.unlocks.challenges[Vn()],n=e?.done?`已完成 · 最佳 ${e.bestLap.toFixed(2)}s`:"未完成",s=e?.done?ou(Vn(),e.bestLap):"";return`
      <section class="screen" data-screen="challenge">
        <p class="kicker">DAILY CHALLENGE · ${Vn()}</p>
        <h2>每日挑战</h2>
        <div class="challenge-card">
          <strong>${this.shortName(t.trackId)} · ${t.variant==="day"?"白天":t.variant==="dusk"?"黄昏":"夜幕"}</strong>
          <small>3 圈 · 目标圈速 ${t.targetLap.toFixed(1)}s · 难度 标准</small>
          <small>状态：${n}</small>
          ${s?`<small>分享码 <code>${s}</code></small>`:""}
        </div>
        <div class="settings-list">
          <label>导入好友码 <input data-challenge-code type="text" placeholder="粘贴挑战码" /></label>
        </div>
        <p class="sub tiny" data-challenge-result></p>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="start">开跑</button>
          <button class="neon-btn ghost" data-act="back">返回</button>
        </div>
      </section>
    `}settingsHtml(){const t=this.app.settings;return`
      <section class="screen" data-screen="settings">
        <p class="kicker">SETTINGS</p>
        <h2>设置</h2>
        <div class="settings-list">
          <label>主音量 <input data-set="masterVolume" type="range" min="0" max="1" step="0.05" value="${t.masterVolume}" /></label>
          <label>BGM <input data-set="bgmVolume" type="range" min="0" max="1" step="0.05" value="${t.bgmVolume}" /></label>
          <label>SFX <input data-set="sfxVolume" type="range" min="0" max="1" step="0.05" value="${t.sfxVolume}" /></label>
          <label>画质
            <select data-set="quality">
              <option value="low" ${t.quality==="low"?"selected":""}>低</option>
              <option value="medium" ${t.quality==="medium"?"selected":""}>中</option>
              <option value="high" ${t.quality==="high"?"selected":""}>高</option>
            </select>
          </label>
          <label>镜头距离
            <select data-set="cameraDistance">
              <option value="near" ${t.cameraDistance==="near"?"selected":""}>近（贴车）</option>
              <option value="mid" ${t.cameraDistance==="mid"?"selected":""}>中（默认）</option>
              <option value="far" ${t.cameraDistance==="far"?"selected":""}>远（视野广）</option>
            </select>
          </label>
          <label>难度
            <select data-set="difficulty" ${this.app.hardUnlocked()?"":'data-hard-locked="1"'}>
              <option value="easy" ${t.difficulty==="easy"?"selected":""}>简单</option>
              <option value="normal" ${t.difficulty==="normal"?"selected":""}>标准（镜像）</option>
              <option value="hard" ${t.difficulty==="hard"&&this.app.hardUnlocked()?"selected":""} ${this.app.hardUnlocked()?"":"disabled"}>困难${this.app.hardUnlocked()?"":"（杯赛夺冠解锁）"}</option>
            </select>
          </label>
          <label>圈数
            <select data-set="laps">
              <option value="2" ${t.laps===2?"selected":""}>2</option>
              <option value="3" ${t.laps===3?"selected":""}>3</option>
              <option value="5" ${t.laps===5?"selected":""}>5</option>
            </select>
          </label>
          <label>自动油门 <input data-set="autoThrottle" type="checkbox" ${t.autoThrottle?"checked":""} /></label>
          <label>转向辅助 <input data-set="assistSteer" type="checkbox" ${t.assistSteer?"checked":""} /></label>
          <label>减少动态 <input data-set="reducedMotion" type="checkbox" ${t.reducedMotion?"checked":""} /></label>
        </div>
        <div class="btn-col">
          <button class="neon-btn" data-act="reset">重置进度</button>
          <button class="neon-btn primary" data-act="back">完成</button>
        </div>
      </section>
    `}pauseHtml(){return`
      <section class="screen" data-screen="pause">
        <p class="kicker">PAUSED</p>
        <h2>暂停</h2>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="resume">继续</button>
          <button class="neon-btn" data-act="restart">重开本局</button>
          <button class="neon-btn" data-act="settings">设置</button>
          <button class="neon-btn ghost" data-act="menu">回主菜单</button>
        </div>
      </section>
    `}resultsHtml(){const t=this.app.unlocks.stars[this.app.trackId]??0;return`
      <section class="screen side" data-screen="results">
        <p class="kicker">RESULTS</p>
        <h2>本局结算</h2>
        <div class="result-stars">${this.stars(t)}</div>
        <p class="sub" id="results-detail"></p>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="primary">继续</button>
          <button class="neon-btn" data-act="restart">再来一局</button>
          <button class="neon-btn ghost" data-act="menu">主菜单</button>
        </div>
      </section>
    `}cupHtml(){const t=this.app.availableCups().find(o=>o.cup.id===this.app.cupId)?.cup,e=this.app.cup.points.slice(0,3),n=this.app.cup.totals,s=n[0],r=Math.max(n[1],n[2],n[3]),a=s>=r?"YOU":["NOVA","PIXEL","YUZU"][n.indexOf(r)-1]??"RIVAL";return`
      <section class="screen side" data-screen="cup-standings">
        <p class="kicker">CUP STANDINGS${a==="YOU"?" · CHAMPION":""}</p>
        <h2>${t?t.nameZh:""} · 积分</h2>
        <div class="cup-points">
          ${e.map((o,l)=>`<div>LEG ${l+1}<strong>${o}</strong></div>`).join("")}
        </div>
        <p class="sub">总积分 <strong style="color:var(--yellow)">${s}</strong> · 冠军 <strong style="color:var(--cyan)">${a}</strong>${a==="YOU"?" 🏆":""}</p>
        <div class="btn-col">
          <button class="neon-btn primary" data-act="primary">回主菜单</button>
        </div>
      </section>
    `}bindMenu(){const t=()=>this.handlers.audio?.menuConfirm();this.root.querySelector('[data-act="primary"]')?.addEventListener("click",()=>{this.app.setScreen("mode"),this.render(),t()}),this.root.querySelector('[data-act="cup"]')?.addEventListener("click",()=>{this.app.setScreen("cup-select"),this.render(),t()}),this.root.querySelector('[data-act="challenge"]')?.addEventListener("click",()=>{this.app.setScreen("challenge"),this.render(),t()}),this.root.querySelector('[data-act="garage"]')?.addEventListener("click",()=>{this.app.setScreen("garage"),this.render(),t()}),this.root.querySelector('[data-act="trophies"]')?.addEventListener("click",()=>{this.app.setScreen("trophies"),this.render(),t()}),this.root.querySelector('[data-act="settings"]')?.addEventListener("click",()=>{this.handlers.onOpenSettings()})}bindMode(){this.root.querySelectorAll("[data-mode]").forEach(t=>{t.addEventListener("click",()=>{this.app.setMode(t.dataset.mode),this.render(),this.handlers.audio?.menuConfirm()})}),this.root.querySelector('[data-act="primary"]')?.addEventListener("click",()=>{if(this.app.mode==="cup"){this.app.setScreen("cup-select"),this.render(),this.handlers.audio?.menuConfirm();return}this.app.setScreen("track"),this.render(),this.handlers.audio?.menuConfirm()}),this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.app.setScreen("menu"),this.render(),this.handlers.audio?.menuCancel()})}bindCupSelect(){this.root.querySelectorAll("[data-cup]").forEach(t=>{t.addEventListener("click",()=>{t.hasAttribute("disabled")||(this.handlers.audio?.menuConfirm(),this.app.startCup(t.dataset.cup))})}),this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.app.setScreen("menu"),this.render(),this.handlers.audio?.menuCancel()})}bindTrack(){this.root.querySelectorAll("[data-track]").forEach(t=>{t.addEventListener("click",()=>{t.hasAttribute("disabled")||(this.app.selectTrack(t.dataset.track),this.render())})}),this.root.querySelectorAll("[data-variant]").forEach(t=>{t.addEventListener("click",()=>{this.app.selectVariant(t.dataset.variant),this.render(),this.handlers.audio?.menuConfirm()})}),this.root.querySelector('[data-act="primary"]')?.addEventListener("click",()=>{this.app.setScreen("paint"),this.render()}),this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.app.setScreen("mode"),this.render()})}bindPaint(){this.root.querySelectorAll("[data-paint]").forEach(t=>{t.addEventListener("click",()=>{t.hasAttribute("disabled")||(this.app.selectPaint(t.dataset.paint),this.render())})}),this.root.querySelectorAll("[data-car]").forEach(t=>{t.addEventListener("click",()=>{t.hasAttribute("disabled")||(this.app.selectCar(t.dataset.car),this.render(),this.handlers.audio?.menuConfirm())})}),this.root.querySelector('[data-act="primary"]')?.addEventListener("click",()=>{this.app.startSession()}),this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.app.setScreen("track"),this.render()})}bindGarage(){this.root.querySelectorAll("[data-car]").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.car;if(this.app.availableCars().find(s=>s.car.id===e)?.unlocked){this.app.selectCar(e),this.render(),this.handlers.audio?.menuConfirm();return}this.app.buyCar(e)?(this.app.selectCar(e),this.handlers.audio?.award(),this.toast(`购车成功！金币余额 ${this.app.unlocks.coins}`)):(this.handlers.audio?.menuCancel(),this.toast("金币不足 —— 去比赛赚金币吧")),this.render()})}),this.root.querySelectorAll("[data-partcat]").forEach(t=>{t.addEventListener("click",()=>{this.partCat=t.dataset.partcat,this.render(),this.handlers.audio?.menuConfirm()})}),this.root.querySelectorAll("[data-part]").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.part,n=t.dataset.cat,s=di(e);if(!(this.app.partOwned(e)||s.price===0)){this.app.buyPart(e)?(this.app.equipPartOn(this.app.carId,n,e),this.handlers.audio?.award(),this.toast(`购买并装备 ${s.name}！金币余额 ${this.app.unlocks.coins}`)):(this.handlers.audio?.menuCancel(),this.toast("金币不足 —— 去比赛赚金币吧")),this.render();return}this.app.equipPartOn(this.app.carId,n,e)&&(this.handlers.audio?.menuConfirm(),this.toast(`已装备 ${s.name}`)),this.render()})}),this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.app.setScreen("menu"),this.render(),this.handlers.audio?.menuCancel()})}bindTrophies(){this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.handlers.onQuitToMenu(),this.handlers.audio?.menuCancel()})}bindChallenge(){this.root.querySelector('[data-act="start"]')?.addEventListener("click",()=>{const e=Zc(Vn());this.app.selectTrack(e.trackId),this.app.selectVariant(e.variant),this.handlers.audio?.menuConfirm(),this.app.startChallenge(Vn())}),this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.app.setScreen("menu"),this.render(),this.handlers.audio?.menuCancel()});const t=this.root.querySelector("[data-challenge-code]");t?.addEventListener("change",()=>{const e=Yv(t.value),n=this.root.querySelector("[data-challenge-result]");if(!n)return;if(!e){n.textContent="挑战码无效";return}const s=this.app.unlocks.challenges[e.dateKey]?.bestLap??0;e.dateKey===Vn()&&s>0?n.textContent=s<=e.bestLap?`你更快！${s.toFixed(2)}s vs ${e.bestLap.toFixed(2)}s`:`对方更快：${e.bestLap.toFixed(2)}s vs 你的 ${s.toFixed(2)}s`:n.textContent=`${e.dateKey} 记录：${e.bestLap.toFixed(2)}s（去挑战这个日期吧）`})}bindSettings(){const t=(e,n,s)=>{e==="masterVolume"||e==="bgmVolume"||e==="sfxVolume"?this.app.updateSettings({[e]:Number(n)}):e==="quality"?this.app.setQuality(n):e==="difficulty"?this.app.setDifficulty(n):e==="laps"?this.app.updateSettings({laps:Number(n)}):e==="cameraDistance"?this.app.setCameraDistance(n):s==="checkbox"&&this.app.updateSettings({[e]:n==="on"||n==="true"})};this.root.querySelectorAll("input[data-set], select[data-set]").forEach(e=>{const n=e.dataset.set,s=()=>{e instanceof HTMLInputElement&&e.type==="checkbox"?t(n,e.checked?"true":"false","checkbox"):t(n,e.value,e instanceof HTMLSelectElement?"select":"range")};e.addEventListener("change",s),e.addEventListener("input",()=>{e instanceof HTMLInputElement&&e.type==="range"&&s()})}),this.root.querySelector('[data-act="back"]')?.addEventListener("click",()=>{this.handlers.onPrimary()}),this.root.querySelector('[data-act="reset"]')?.addEventListener("click",()=>{this.app.resetProgress(),this.render()})}bindPause(){this.root.querySelector('[data-act="resume"]')?.addEventListener("click",()=>{this.handlers.onResume()}),this.root.querySelector('[data-act="restart"]')?.addEventListener("click",()=>{this.handlers.onRestart()}),this.root.querySelector('[data-act="settings"]')?.addEventListener("click",()=>{this.app.setScreen("settings"),this.render()}),this.root.querySelector('[data-act="menu"]')?.addEventListener("click",()=>{this.handlers.onQuitToMenu()})}bindResults(){this.root.querySelector('[data-act="primary"]')?.addEventListener("click",()=>{this.app.mode==="cup"&&!this.app.cup.finished?this.app.nextCupLeg():this.handlers.onQuitToMenu()}),this.root.querySelector('[data-act="restart"]')?.addEventListener("click",()=>{this.handlers.onRestart()}),this.root.querySelector('[data-act="menu"]')?.addEventListener("click",()=>{this.handlers.onQuitToMenu()})}bindCup(){this.root.querySelector('[data-act="primary"]')?.addEventListener("click",()=>{this.handlers.onQuitToMenu()})}setResultsDetail(t){const e=this.root.querySelector("#results-detail");e&&(e.textContent=t)}toast(t){const e=document.querySelector("#toast");e&&(e.textContent=t,e.classList.remove("show"),e.offsetWidth,e.classList.add("show"),window.setTimeout(()=>e.classList.remove("show"),1900))}}function Kv(i){return{accel:"加速",maxSpeed:"极速",boostSpeed:"氮气",steerRate:"转向",grip:"抓地",driftGrip:"漂移",brakeForce:"制动",boostDrain:"氮耗"}[i]??i}function bn(i,t){return`<div class="stat-row"><span>${i}</span><div class="stat-bar"><div style="width:${Math.max(8,Math.min(100,t))}%"></div></div></div>`}const Rs=[{id:"classic",nameZh:"经典杯",nameEn:"CLASSIC CUP",trophyZh:"经典杯冠军",legs:["neon-loop","sunset-pier","void-grid"]},{id:"art",nameZh:"艺术杯",nameEn:"ART CUP",trophyZh:"艺术杯冠军",legs:["pop-burst","monet-lily","ink-wash"]},{id:"speed",nameZh:"极速杯",nameEn:"SPEED CUP",trophyZh:"极速杯冠军",legs:["sunset-pier","pixel-rush","red-october"]},{id:"future",nameZh:"未来杯",nameEn:"FUTURE CUP",trophyZh:"未来杯冠军",legs:["void-grid","neon-rain","minimal-clean"]}];function ys(i){return Rs.find(t=>t.id===i)??Rs[0]}const zr=[{id:"nova",name:"NOVA",body:"#2dfff3",accent:"#ff2d95",emissive:"#2dfff3",unlockHint:"初始涂装",unlock:{kind:"default"}},{id:"pixel",name:"PIXEL",body:"#ffe600",accent:"#b84dff",emissive:"#ffe600",unlockHint:"完成任意杯赛",unlock:{kind:"cup-finish"}},{id:"yuzu",name:"YUZU",body:"#b84dff",accent:"#2dfff3",emissive:"#b84dff",unlockHint:"累计氮气 15 次",unlock:{kind:"boost-count",value:15}},{id:"blush",name:"BLUSH",body:"#ff2d95",accent:"#ffe600",emissive:"#ff2d95",unlockHint:"杯赛夺冠 或 落日栈桥金圈",unlock:{kind:"cup-win"}}];function lu(i){return zr.find(t=>t.id===i)??zr[0]}const cn={positionBase:[120,90,60,35],starBonus:25,trialBonus:20,cupFinish:150,cupWin:400,challengeFirst:250,goldFirst:150,driftPer:50,driftCap:200};function Jv(i){return cn.positionBase[Math.min(Math.max(i-1,0),cn.positionBase.length-1)]??cn.positionBase[cn.positionBase.length-1]}function jv(i,t,e){let n=Jv(i)+t*cn.starBonus;return e==="time-trial"&&(n+=cn.trialBonus),Math.round(n)}function Kc(i){return i?cn.cupWin:cn.cupFinish}function Qv(i){return Math.min(cn.driftCap,Math.round(i/cn.driftPer))}function t_(){return cn.challengeFirst}function e_(){return cn.goldFirst}class n_{constructor(t){this.events=t;const e=bv();this.settings=e.settings,this.unlocks=e.unlocks}screen="boot";mode="race";trackId=hn[0].id;variant="day";paintId=zr[0].id;carId=Br[0].id;cupId=Rs[0].id;cupState={cupId:Rs[0].id,leg:0,points:[0,0,0],totals:[0,0,0,0],finished:!1};settings;unlocks;setScreen(t){this.screen!==t&&(this.screen=t,this.events.onScreenChange(t))}get track(){return es(this.trackId)}get paint(){return lu(this.paintId)}get car(){return zs(this.carId)}get cup(){return this.cupState}availableTracks(){return hn.map(t=>({def:t,unlocked:Hc(this.unlocks,t.id)||this.mode==="cup"}))}availablePaints(){return zr.map(t=>({paint:t,unlocked:Vc(this.unlocks,t.id)}))}availableCars(){return Br.map(t=>({car:t,unlocked:Wc(this.unlocks,t.id)}))}availableCups(){return Rs.map(t=>({cup:t,unlocked:Xc(this.unlocks,t.id),won:this.unlocks.trophies.includes(t.id)}))}selectTrack(t){this.trackId=t}selectVariant(t){this.variant=t}selectPaint(t){!Vc(this.unlocks,t)&&t!=="nova"||(this.paintId=t)}selectCar(t){!Wc(this.unlocks,t)&&t!=="nova"||(this.carId=t)}selectCup(t){!Xc(this.unlocks,t)&&t!=="classic"||(this.cupId=t)}setMode(t){this.mode=t}updateSettings(t){this.settings={...this.settings,...t},Gn({settings:this.settings,unlocks:this.unlocks}),this.events.onSettingsChange(this.settings)}resetProgress(){const t=wv();this.settings=t.settings,this.unlocks=t.unlocks,this.events.onSettingsChange(this.settings),this.events.onUnlocksChange(this.unlocks)}sessionTrack(){return Hv(es(this.trackId),this.variant)}sessionConfig(){const t=this.settings.laps;if(this.mode==="cup"){const e=ys(this.cupId);return{mode:"cup",trackId:e.legs[this.cup.leg%e.legs.length],variant:this.variant,paintId:this.paintId,carId:this.carId,laps:t,difficulty:this.settings.difficulty,cupId:e.id,cupLeg:this.cup.leg}}return{mode:this.mode,trackId:this.trackId,variant:this.variant,paintId:this.paintId,carId:this.carId,laps:t,difficulty:this.settings.difficulty}}startCup(t){t&&(this.cupId=t),this.mode="cup",this.cupState={cupId:this.cupId,leg:0,points:[0,0,0],totals:[0,0,0,0],finished:!1},this.trackId=ys(this.cupId).legs[0],this.events.onSessionStart(this.sessionConfig()),this.setScreen("race")}startSession(){if(this.mode==="cup"){this.startCup();return}this.events.onSessionStart(this.sessionConfig()),this.setScreen("race")}restartSession(){this.events.onSessionStart(this.sessionConfig()),this.setScreen("race")}pointsFor(t){return[10,8,6,4][t-1]??2}completeRace(t){let e=this.unlocks;const n=t.position===1;if(e=Ve(e,{type:"career",distance:t.distance,win:n}),t.boostHits>0)for(let s=0;s<t.boostHits;s+=1)e=Ve(e,{type:"boost"});if(t.bestLap>0&&(e=Ve(e,{type:"gold-lap",trackId:t.trackId,bestLap:t.bestLap})),t.driftScore>0&&(e=Ve(e,{type:"drift-score",score:t.driftScore}),e=Ve(e,{type:"coins",amount:Qv(t.driftScore)})),t.bestLap>0&&eu(t.trackId,t.bestLap)&&!e.goldLaps.includes(t.trackId)&&(e=Ve(e,{type:"coins",amount:e_()})),e=Ve(e,{type:"coins",amount:jv(t.position,t.stars,this.mode)}),t.stars>0&&(e=Ve(e,{type:"stars",trackId:t.trackId,stars:t.stars})),t.position===1&&(e=Ve(e,{type:"race-win"})),this.mode!=="time-trial"&&(e=Ve(e,{type:"track-clear",trackId:t.trackId})),this.mode==="cup"){const s=ys(this.cupId),r=this.cupState.leg;(t.order??[0,1,2,3]).forEach((l,c)=>{const h=this.pointsFor(c+1);this.cupState.totals[l]=(this.cupState.totals[l]??0)+h,l===0&&(this.cupState.points[r]=h)});const o=r>=s.legs.length-1;if(this.cupState.leg=o?r:r+1,this.cupState.finished=o,o){e=Ve(e,{type:"cup-finish"}),e=Ve(e,{type:"coins",amount:Kc(!1)});const l=this.cup.totals[0],c=Math.max(this.cup.totals[1],this.cup.totals[2],this.cup.totals[3]);l>=c&&(e=Ve(e,{type:"cup-win",difficulty:this.settings.difficulty}),e=Ve(e,{type:"cup-trophy",cupId:s.id,difficulty:this.settings.difficulty}),e=Ve(e,{type:"coins",amount:Kc(!0)}))}this.unlocks=e,Gn({settings:this.settings,unlocks:e}),this.events.onUnlocksChange(e),this.setScreen(o?"cup-standings":"results");return}this.unlocks=e,Gn({settings:this.settings,unlocks:e}),this.events.onUnlocksChange(e),this.setScreen("results")}nextCupLeg(){if(this.cup.finished){this.setScreen("menu");return}this.trackId=ys(this.cupId).legs[this.cup.leg%ys(this.cupId).legs.length],this.events.onSessionStart(this.sessionConfig()),this.setScreen("race")}buyCar(t){const e=zs(t),n=Ev(this.unlocks,e.id,e.price);return n?(this.unlocks=n,Gn({settings:this.settings,unlocks:this.unlocks}),this.events.onUnlocksChange(this.unlocks),!0):!1}buyPart(t){const e=Tv(this.unlocks,t,di(t).price);return e?(this.unlocks=e,Gn({settings:this.settings,unlocks:this.unlocks}),this.events.onUnlocksChange(this.unlocks),!0):!1}equipPartOn(t,e,n){const s=Av(this.unlocks,t,e,n);return s?(this.unlocks=s,Gn({settings:this.settings,unlocks:this.unlocks}),this.events.onUnlocksChange(this.unlocks),!0):!1}loadoutFor(t){return al(this.unlocks,t)}partOwned(t){return this.unlocks.parts.includes(t)}partEquippedOn(t,e){return Cv(this.unlocks,t,e)}startChallenge(t){this.mode="challenge",this.events.onSessionStart(this.sessionConfig()),this.setScreen("race")}recordChallenge(t,e){const n=this.unlocks.challenges[t];if(!n?.done){this.unlocks=Ve(this.unlocks,{type:"coins",amount:t_()}),this.unlocks.challenges[t]={done:!0,bestLap:e>0?e:0},Gn({settings:this.settings,unlocks:this.unlocks}),this.events.onUnlocksChange(this.unlocks);return}e>0&&e<n.bestLap&&(this.unlocks.challenges[t]={done:!0,bestLap:e},Gn({settings:this.settings,unlocks:this.unlocks}))}hardUnlocked(){return this.unlocks.hardDifficulty}setDifficulty(t){t==="hard"&&!this.unlocks.hardDifficulty||this.updateSettings({difficulty:t})}setQuality(t){this.updateSettings({quality:t})}setCameraDistance(t){this.updateSettings({cameraDistance:t})}cycleCameraDistance(){const t=["near","mid","far"],e=t[(t.indexOf(this.settings.cameraDistance)+1)%t.length];return this.setCameraDistance(e),e}albumProgress(){return Zx.map(t=>({def:es(t),unlocked:Hc(this.unlocks,t),stars:this.unlocks.stars[t]??0,bestLap:this.unlocks.bestLaps[t]??0}))}}function ci(i){const t=new ge;t.name="vegetation";for(const e of i){if(e.parts.length===0)continue;const n=new Ee(e.geometry,e.material,e.parts.length),s=e.parts.map(r=>{const a=r.transform,o=Math.cos(a.rotationY),l=Math.sin(a.rotationY),[c,h,u]=r.offset,d=new A(c*o+u*l,h,-c*l+u*o);let f=a.scale;return e.preScale&&(f=new A(e.preScale[0],e.preScale[1],e.preScale[2]).multiplyScalar(a.scale)),{position:a.position.clone().add(d),rotationY:a.rotationY,rotationX:r.extraRotX??0,scale:f}});Ke(n,s),n.castShadow=!0,t.add(n)}return t}function Mr(i,t,e){const n=Math.abs((Math.floor(t*7)+Math.floor(e*13))%i.length);return i[n]}function i_(i,t){const e=new ge;if(e.name="vegetation",i==="none"||t.length===0)return e;if(i==="palm"){const l=mt("palm-trunk",()=>{const x=new Ne(.28,.5,8,6,3);return x.translate(0,4,0),x}),c=Lt("palm-trunk",{color:"#1a0c2c",roughness:.9}),h=mt("palm-frond",()=>{const x=new Pe(.34,.12,4.4);return x.translate(0,0,2.2),x}),u=[Lt("palm-frond-a",{color:"#ff2d95",emissive:"#ff2d95",emissiveIntensity:.25,roughness:.7}),Lt("palm-frond-b",{color:"#2dfff3",emissive:"#2dfff3",emissiveIntensity:.25,roughness:.7})],d={geometry:l,material:c,parts:[]},f={geometry:h,material:u[0],parts:[]},p={geometry:h,material:u[1],parts:[]};for(const x of t){d.parts.push({transform:x,offset:[0,0,0]});const g=7;for(let m=0;m<g;m+=1)(m%2===0?f:p).parts.push({transform:{...x,rotationY:x.rotationY+m/g*Math.PI*2},offset:[0,8,0],extraRotX:-.45})}return ci([d,f,p])}if(i==="pop-flower"){const l=mt("pop-stem",()=>{const f=new Ne(.22,.3,3.6,8);return f.translate(0,1.8,0),f}),c=Lt("pop-stem",{color:"#111111",roughness:.8}),h=mt("pop-blob",()=>new Os(1.9,1)),u=[15676224,16765503,3835647,448160].map(f=>({geometry:h,material:Lt(`pop-blob-${f}`,{color:f,roughness:.55}),parts:[]})),d={geometry:l,material:c,parts:[]};for(const f of t){const p=3.6*f.scale;d.parts.push({transform:f,offset:[0,0,0]}),Mr(u,f.position.x,f.position.z).parts.push({transform:f,offset:[0,p+1.2,0]})}return ci([d,...u])}if(i==="willow"){const l=mt("willow-trunk",()=>{const f=new Ne(.35,.62,4.2,7,4);return f.translate(0,2.1,0),f}),c=Lt("willow-trunk",{color:"#6a5648",roughness:.95}),h=mt("willow-canopy",()=>{const f=new Kn(1,10,8);return f.scale(3.4,2.6,3.4),f.translate(0,2.2,0),f}),u=[9416314,10336410,8298618].map(f=>({geometry:h,material:Lt(`willow-${f}`,{color:f,roughness:.9,flatShading:!0}),parts:[]})),d={geometry:l,material:c,parts:[]};for(const f of t)d.parts.push({transform:f,offset:[0,0,0]}),Mr(u,f.position.x,f.position.z).parts.push({transform:f,offset:[0,4.2*(f.scale-1)+1.4,0]});return ci([d,...u])}if(i==="pine"){const l=mt("pine-trunk",()=>{const g=new Ne(.24,.4,2,6);return g.translate(0,1,0),g}),c=Lt("pine-trunk",{color:"#2d2419",roughness:.95}),h=mt("pine-cone",()=>new ts(1,1,7)),u=Lt("pine-cone-dark",{color:"#1f2f22",roughness:.9,flatShading:!0}),d=Lt("pine-cone-deep",{color:"#16241a",roughness:.9,flatShading:!0}),f={geometry:l,material:c,parts:[]},p={geometry:h,material:u,preScale:[3.4,5.2,3.4],parts:[]},x={geometry:h,material:d,preScale:[2.3,4.4,2.3],parts:[]};for(const g of t)f.parts.push({transform:g,offset:[0,0,0]}),p.parts.push({transform:g,offset:[0,4.1,0]}),x.parts.push({transform:g,offset:[0,6.4,0]});return ci([f,p,x])}if(i==="bamboo"){const l=mt("bamboo-culm",()=>{const p=new Ne(.14,.18,7.5,5,3);return p.translate(0,3.75,0),p}),c=Lt("bamboo-culm",{color:"#6f6a5e",roughness:.9}),h=mt("bamboo-leaf",()=>{const p=new Pe(.7,.05,.18);return p.translate(.5,0,0),p}),u=Lt("bamboo-leaf",{color:"#4a463e",roughness:.9,side:xe}),d={geometry:l,material:c,parts:[]},f={geometry:h,material:u,parts:[]};for(const p of t){const x=2+Math.floor(p.position.x*13)%2;for(let g=0;g<x;g+=1){const m=(g-(x-1)/2)*.7;d.parts.push({transform:p,offset:[m,0,0]});for(let v=0;v<4;v+=1)f.parts.push({transform:{...p,rotationY:p.rotationY+v*1.9+g},offset:[m+.1,4.2+v*.9,0],extraRotX:-.25-v%2*.2})}}return ci([d,f])}if(i==="pixel-tree"){const l=mt("pixel-trunk",()=>{const f=new Pe(.9,3.4,.9);return f.translate(0,1.7,0),f}),c=Lt("pixel-trunk",{color:"#5a4a3a",roughness:.9}),h=mt("pixel-block-leaf",()=>new Pe(1.7,1.7,1.7)),u=[57508,3835647,16765503].map(f=>({geometry:h,material:Lt(`pixel-leaf-${f}`,{color:f,roughness:.8}),parts:[]})),d={geometry:l,material:c,parts:[]};for(const f of t){d.parts.push({transform:f,offset:[0,0,0]});const p=Mr(u,f.position.x,f.position.z);p.parts.push({transform:f,offset:[0,4.4,0]}),p.parts.push({transform:f,offset:[0,6.1,0]})}return ci([d,...u])}if(i==="minimal-orb"){const l=mt("minimal-stem",()=>{const p=new Ne(.12,.16,2.6,6);return p.translate(0,1.3,0),p}),c=Lt("minimal-stem",{color:"#22262b",roughness:.7}),h=mt("minimal-orb",()=>new Kn(1.15,18,14)),u=Lt("minimal-orb",{color:"#eef1f4",roughness:.35,metalness:.05}),d={geometry:l,material:c,parts:[]},f={geometry:h,material:u,parts:[]};for(const p of t)d.parts.push({transform:p,offset:[0,0,0]}),f.parts.push({transform:p,offset:[0,3.6,0]});return ci([d,f])}const n=mt("sakura-trunk",()=>{const l=new Ne(.22,.4,3.4,6,2);return l.translate(0,1.7,0),l}),s=Lt("sakura-trunk",{color:"#4a3540",roughness:.95}),r=mt("sakura-canopy",()=>{const l=new Os(1,1);return l.scale(2.6,1.7,2.6),l}),a=[16758741,16752324,16764899].map(l=>({geometry:r,material:Lt(`sakura-${l}`,{color:l,roughness:.85,flatShading:!0}),parts:[]})),o={geometry:n,material:s,parts:[]};for(const l of t)o.parts.push({transform:l,offset:[0,0,0]}),Mr(a,l.position.x,l.position.z).parts.push({transform:l,offset:[0,3.4*l.scale,0]});return ci([o,...a])}function s_(i){const t=new Nt(i.sky.bottom),e=new Nt(i.sky.mid),n=new Nt(i.sky.top),s=new Tt(mt("sky-dome",()=>new Kn(400,32,16)),new an({side:Xe,depthWrite:!1,uniforms:{uBottom:{value:t},uMid:{value:e},uTop:{value:n}},vertexShader:"varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",fragmentShader:`
        varying vec3 vPos;
        uniform vec3 uBottom;
        uniform vec3 uMid;
        uniform vec3 uTop;
        void main(){
          float h = normalize(vPos).y * 0.5 + 0.5;
          // visible band from a low chase camera sits near h≈0.5 — put the
          // mid color at the horizon and reach the top color by ~25° elevation
          vec3 col = h < 0.5 ? mix(uBottom, uMid, smoothstep(0.32, 0.5, h)) : mix(uMid, uTop, smoothstep(0.5, 0.72, h));
          float band = exp(-pow((h-0.5)*22.0, 2.0));
          col += uMid * band * 0.3;
          gl_FragColor = vec4(col, 1.0);
        }
      `}));return s.name="sky",s}function r_(){const i=qn(7),t=420,e=new Float32Array(t*3);for(let r=0;r<t;r+=1){const a=i()*Math.PI*2,o=.08+i()*.85,l=380;e[r*3]=Math.cos(a)*l*Math.cos(o*1.2),e[r*3+1]=Math.sin(o*1.2)*l*.9,e[r*3+2]=Math.sin(a)*l*Math.cos(o*1.2)}const n=new _e;n.setAttribute("position",new Ze(e,3));const s=new Hd(n,new wh({color:"#cfe8ff",size:2.4,sizeAttenuation:!1,transparent:!0,opacity:.85}));return s.name="stars",s}function a_(i,t){const e=document.createElement("canvas");e.width=1024,e.height=512;const n=e.getContext("2d");n.fillStyle=t,n.fillRect(0,0,1024,512);const s=512,r=400;n.fillStyle=i;for(let l=0;l<24;l+=2){const c=l/24*Math.PI,h=(l+1)/24*Math.PI;n.beginPath(),n.moveTo(s,r),n.lineTo(s+Math.cos(c)*1200,r-Math.sin(c)*1200),n.lineTo(s+Math.cos(h)*1200,r-Math.sin(h)*1200),n.closePath(),n.fill()}const a=new ls(e);a.colorSpace=Re;const o=new Tt(new Ae(900,450),new Oe({map:a,depthWrite:!1,fog:!1}));return o.position.set(0,120,-330),o.name="sunburst",o}function o_(i=!1){const t=document.createElement("canvas");t.width=1024,t.height=512;const e=t.getContext("2d");e.clearRect(0,0,1024,512);const n=qn(i?890:1890),s=i?["#c9c4b8","#a9a69c","#8f8c84","#dad5c8","#6f6c66"]:["#ffffff","#f5c6d6","#cdb4de","#a3c4e4","#f5e6c8"];for(let o=0;o<300;o+=1){e.globalAlpha=.08+n()*.16,e.fillStyle=s[Math.floor(n()*s.length)];const l=n()*320,c=n()*1024;e.save(),e.translate(c,l),e.rotate((n()-.5)*.1),e.fillRect(-90-n()*80,-5,180+n()*160,10+n()*8),e.restore()}i&&["#8f8c84","#75726b","#5c5a55"].forEach((l,c)=>{e.globalAlpha=.5-c*.12,e.fillStyle=l,e.beginPath(),e.moveTo(0,320+c*40);let h=0;for(;h<1024;){const u=180+n()*110-c*20,d=90+n()*140;e.quadraticCurveTo(h+d/2,320+c*40-u,h+d,320+c*40),h+=d}e.lineTo(1024,512),e.lineTo(0,512),e.closePath(),e.fill()}),e.globalAlpha=1;const r=new ls(t);r.colorSpace=Re;const a=new Tt(new Ae(760,380),new Oe({map:r,transparent:!0,depthWrite:!1,fog:!1}));return a.position.set(0,110,-320),a.name="stroke-sky",a}function l_(){const i=document.createElement("canvas");i.width=512,i.height=256;const t=i.getContext("2d"),e=["#3a86ff","#8f5cff","#ff5c8a","#ffd23f"],n=32;for(let o=0;o<8;o+=1)t.fillStyle=e[Math.min(o,e.length-1)],t.fillRect(0,o*n,512,n);const s=qn(88);for(let o=1;o<8;o+=1)for(let l=0;l<16;l+=1)s()>.5&&(t.fillStyle=e[Math.min(o,e.length-1)],t.fillRect(l*n,o*n,n,n));t.fillStyle="#ffe86b",t.fillRect(13*n,1*n,2*n,2*n);const r=new ls(i);r.colorSpace=Re,r.magFilter=Fe;const a=new Tt(new Ae(760,380),new Oe({map:r,depthWrite:!1,fog:!1}));return a.position.set(0,110,-320),a.name="pixel-sky",a}function c_(i="#ffffff"){const t=new ge;t.name="clouds";const e=qn(99),n=vn(`cloud-sprite-${i}`,()=>new Oe({map:zx(),color:new Nt(i),transparent:!0,opacity:.92,depthWrite:!1,fog:!1})),s=mt("cloud-plane",()=>new Ae(1,.5)),r=[];for(let o=0;o<14;o+=1){const l=o/14*Math.PI*2+.3,c=250+e()*90,h=60+e()*90;r.push({position:new A(Math.cos(l)*c,60+e()*70,Math.sin(l)*c),rotationY:l+Math.PI/2,scale:new A(h,h,1)})}const a=new Ee(s,n,r.length);return Ke(a,r),t.add(a),t}function h_(){const i=new ge;i.name="rain";const t=900,e=qn(4242),n=new Float32Array(t*6),s=new Float32Array(t);for(let c=0;c<t;c+=1){const h=(e()-.5)*180,u=e()*60,d=(e()-.5)*180,f=.7+e()*.9;n[c*6]=h,n[c*6+1]=u,n[c*6+2]=d,n[c*6+3]=h+.12,n[c*6+4]=u+f,n[c*6+5]=d,s[c]=18+e()*14}const r=new _e;r.setAttribute("position",new Ze(n,3));const a=new bh({color:"#7ea6c9",transparent:!0,opacity:.34,fog:!1}),o=new Vd(r,a);o.frustumCulled=!1,i.add(o);const l=n.slice();return{group:i,animate:c=>{const h=r.attributes.position.array;for(let u=0;u<t;u+=1){const d=c*s[u]%60,f=l[u*6],p=l[u*6+2],g=l[u*6+1]-d,m=l[u*6+4]-l[u*6+1];h[u*6]=f,h[u*6+1]=g,h[u*6+2]=p,h[u*6+3]=f+.12,h[u*6+4]=g+m,h[u*6+5]=p}r.attributes.position.needsUpdate=!0}}}function u_(i,t){const e=new ge;e.name="ground";let n;if(i.ground.pattern==="dots"){const r=Uc(i.ground.base,i.ground.patternColor);r.repeat.set(60,60),n=new Ce({map:r,roughness:.9})}else if(i.ground.pattern==="water"){const r=Nc(i.ground.base,i.ground.patternColor);r.repeat.set(24,24),n=new Ce({map:r,roughness:.35,metalness:.25})}else if(i.ground.pattern==="field"){const r=kx(i.ground.base,i.ground.patternColor);r.repeat.set(20,20),n=new Ce({map:r,roughness:.95})}else if(i.ground.pattern==="wet"){const r=Nc(i.ground.base,i.ground.patternColor);r.repeat.set(30,30),n=new Ce({map:r,roughness:.14,metalness:.55,envMapIntensity:.4})}else if(i.ground.pattern==="paper"){const r=Bx(i.ground.base,i.ground.patternColor);r.repeat.set(16,16),n=new Ce({map:r,roughness:.92})}else if(i.ground.pattern==="checker"){const r=Uc(i.ground.base,i.ground.patternColor);r.repeat.set(48,48),n=new Ce({map:r,roughness:.9})}else i.ground.pattern==="white"?n=new Ce({color:i.ground.base,roughness:.85,metalness:.02}):i.ground.pattern==="plaza"?n=new Ce({color:i.ground.base,roughness:.95}):n=new Ce({color:i.ground.base,roughness:.95,metalness:0});const s=new Tt(mt("ground-plane",()=>new Ae(760,760)),n);if(s.rotation.x=-Math.PI/2,s.position.y=-.14,s.receiveShadow=!0,e.add(s),i.ground.pattern==="grid"){const r=new an({transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uColor:{value:new Nt(i.ground.patternColor)}},vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",fragmentShader:`
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        void main(){
          vec2 p = (vUv - 0.5) * 60.0;
          p.y += uTime * 2.0;
          vec2 g = abs(fract(p) - 0.5);
          float line = 1.0 - smoothstep(0.0, 0.06, min(g.x, g.y));
          float fade = 1.0 - smoothstep(0.2, 0.5, length(vUv - 0.5));
          float a = line * fade * 0.22;
          if (a < 0.02) discard;
          gl_FragColor = vec4(uColor, a);
        }
      `}),a=new Tt(mt("grid-plane",()=>new Ae(600,600)),r);a.rotation.x=-Math.PI/2,a.position.y=-.05,a.renderOrder=-1,a.name="grid",e.add(a)}return e}function d_(i,t,e){const n=(()=>{switch(i.style){case"vapor":case"pier":case"void":return{count:26,radiusMin:40,radiusMax:140,yMin:8,yMax:34,motion:"spin",scaleMin:1.4,scaleMax:3};case"pop":return{count:30,radiusMin:35,radiusMax:130,yMin:4,yMax:26,motion:"spin",scaleMin:.8,scaleMax:2.2};case"rain":return{count:22,radiusMin:45,radiusMax:135,yMin:12,yMax:38,motion:"spin",scaleMin:.8,scaleMax:1.8};case"pixel":return{count:26,radiusMin:40,radiusMax:125,yMin:6,yMax:26,motion:"spin",scaleMin:1.2,scaleMax:2.4};case"monet":return{count:60,radiusMin:15,radiusMax:120,yMin:6,yMax:26,motion:"petal",scaleMin:.5,scaleMax:1.1};case"soviet":return{count:18,radiusMin:40,radiusMax:130,yMin:8,yMax:30,motion:"orbit",scaleMin:.8,scaleMax:1.8};case"anime":return{count:70,radiusMin:12,radiusMax:110,yMin:4,yMax:24,motion:"petal",scaleMin:.4,scaleMax:1};default:return{count:0,radiusMin:0,radiusMax:0,yMin:0,yMax:0,motion:"spin",scaleMin:1,scaleMax:1}}})();if(n.count===0)return null;let s,r;if(i.style==="pop")s=mt("floater-sphere",()=>new Os(1,1)),r=Lt("floater-pop",{color:"#ffffff",roughness:.4,flatShading:!0});else if(i.style==="soviet")s=mt("floater-star",()=>{const f=new rn;for(let x=0;x<10;x+=1){const g=x%2===0?1:.42,m=x/10*Math.PI*2+Math.PI/2-Math.PI,v=Math.cos(m)*g,M=Math.sin(m)*g;x===0?f.moveTo(v,M):f.lineTo(v,M)}f.closePath();const p=new Rn(f,{depth:.2,bevelEnabled:!1});return p.translate(0,0,-.1),p}),r=Lt("floater-soviet",{color:"#d52b1e",emissive:"#d52b1e",emissiveIntensity:.35,roughness:.5,side:xe});else if(i.style==="rain")s=mt("floater-glitch",()=>new Pe(2.2,2.2,.18)),r=Lt("floater-rain",{color:"#0d2436",emissive:"#2de2ff",emissiveIntensity:.5,roughness:.3,metalness:.6,side:xe,transparent:!0,opacity:.85});else if(n.motion==="petal"){s=mt("floater-petal",()=>{const p=new rn;return p.moveTo(0,0),p.quadraticCurveTo(.5,.4,0,1),p.quadraticCurveTo(-.5,.4,0,0),new Gs(p)});const f=i.style==="anime"?"#ffb7d5":"#f5c6d6";r=Lt(`floater-petal-${i.style}`,{color:f,emissive:f,emissiveIntensity:.12,roughness:.8,side:xe})}else{s=mt("floater-cube",()=>new Pe(2,2,2));const f=[i.edgeB,i.edgeA,"#ffe600",i.accent];r=Lt("floater-neon",{color:f[0],emissive:f[0],emissiveIntensity:.45,roughness:.4})}const a=new Ee(s,r,n.count);a.name="floaters";const o=new A,l=e.curve.getPoints(64);l.forEach(f=>o.add(f)),o.divideScalar(l.length);const c=[];let h=0;for(;c.length<n.count&&h<n.count*12;){h+=1;const f=t()*Math.PI*2,p=n.radiusMin+t()*(n.radiusMax-n.radiusMin),x=o.x+Math.cos(f)*p,g=o.z+Math.sin(f)*p,m=e.findClosestU(new A(x,0,g));Math.abs(m.lateral)<e.roadHalfWidth+8||c.push({x,z:g,y:n.yMin+t()*(n.yMax-n.yMin),radius:p,angle:f,scale:n.scaleMin+t()*(n.scaleMax-n.scaleMin)})}for(;c.length<n.count;){const f=t()*Math.PI*2,p=n.radiusMax+10+t()*40;c.push({x:o.x+Math.cos(f)*p,z:o.z+Math.sin(f)*p,y:n.yMin+t()*(n.yMax-n.yMin),radius:p,angle:f,scale:n.scaleMin+t()*(n.scaleMax-n.scaleMin)})}const u=[],d=[];for(let f=0;f<n.count;f+=1)if(u.push(t()*Math.PI*2),d.push(.5+t()*1.2),i.style==="pop"){const p=["#ef3340","#ffd23f","#3a86ff","#06d6a0"],x=new Nt(p[Math.floor(t()*p.length)]);a.setColorAt(f,x),r.color.set("#ffffff")}return a.instanceColor&&(a.instanceColor.needsUpdate=!0),{mesh:a,spec:n,anchors:c,phases:u,speeds:d}}function f_(i,t,e,n,s,r){const a=new ee,o=new un,l=new je,c=new A,h=new A,u=Math.min(t.count,e.length);for(let d=0;d<u;d+=1){const f=e[d],p=n[d],x=s[d];if(t.motion==="petal"){const g=(r*x*1.6+p*8)%(t.yMax-t.yMin+6),m=f.y+t.yMax+3-g,v=Math.sin(r*x+p)*3;f.angle,c.set(f.x+v,m,f.z),l.set(r*x,p,Math.sin(r+p)*.6),h.setScalar(f.scale)}else if(t.motion==="orbit"){const g=p+r*x*.3;c.set(Math.cos(g)*f.radius,f.y+Math.sin(r*.7+p)*.8,Math.sin(g)*f.radius),l.set(r*.4+p,r*.6,0),h.setScalar(f.scale)}else c.set(f.x,f.y+Math.sin(r*.8+p)*1.2,f.z),l.set(r*.4+p,r*.6,0),h.setScalar(f.scale);o.setFromEuler(l),a.compose(c,o,h),i.setMatrixAt(d,a)}i.instanceMatrix.needsUpdate=!0}function Jc(i,t,e,n,s,r,a){const o=[];for(let l=0;l<e;l+=1){const c=l/e+t()*.012,h=i.sampleAtU(c),d=(l%2===0?-1:1)*(i.roadHalfWidth+n+t()*s);o.push({position:h.position.clone().addScaledVector(h.right,d).setY(0),rotationY:t()*Math.PI*2,scale:r+t()*(a-r)})}return o}function cu(i,t,e,n,s,r,a){const o=new A,l=i.curve.getPoints(64);l.forEach(u=>o.add(u)),o.divideScalar(l.length);const c=[];let h=0;for(;c.length<e&&h<e*8;){h+=1;const u=t()*Math.PI*2,d=n+t()*(s-n),f=o.x+Math.cos(u)*d,p=o.z+Math.sin(u)*d,x=i.findClosestU(new A(f,0,p));Math.abs(x.lateral)<i.roadHalfWidth+6||c.push({position:new A(f,0,p),rotationY:t()*Math.PI*2,scale:r+t()*(a-r)})}return c}function p_(i,t){const e=t.theme,n=new ge;n.name="world",n.userData.theme=e;const s=qn(t.id.length*7919+42),r=[];if(n.add(s_(e)),e.sky.kind==="stars"&&n.add(r_()),e.sky.kind==="sunburst"&&n.add(a_(e.sky.mid,e.sky.bottom)),(e.sky.kind==="strokes"||e.sky.kind==="ink")&&n.add(o_(e.sky.kind==="ink")),e.sky.kind==="pixel"&&n.add(l_()),e.sky.kind==="clouds"||e.sky.kind==="rain-clouds"){const p=c_(e.sky.kind==="rain-clouds"?"#3a3f52":"#ffffff");n.add(p),r.push(x=>{p.rotation.y=x*.004})}if(e.rain){const p=h_();n.add(p.group),r.push(x=>p.animate(x))}if(e.landmark==="sun"){const p=jc(1.45);p.position.set(0,34,-200),n.add(p)}else if(e.landmark==="arch"){const p=jc(.85);p.position.set(0,28,-180),n.add(p);const x=Pa("arch",e);x.position.set(0,0,-140),n.add(x)}else if(e.landmark==="tower"){const p=Pa("tower",e);p.position.set(40,0,-160),n.add(p)}else{const p=Pa(e.landmark,e);p.position.set(0,0,-220),n.add(p)}n.add(u_(e));const a=n.getObjectByName("grid");a instanceof Tt&&a.material instanceof an&&r.push(p=>{a.material.uniforms.uTime.value=p});const o=[];if(e.tree!=="none"&&(o.push(...Jc(i,s,26,4,26,.8,1.5)),o.push(...cu(i,s,22,24,160,.9,1.7)),n.add(i_(e.tree,o))),e.building!=="none"){const p=Jc(i,s,18,14,22,.85,1.35);n.add(tv(e.building,e,p))}const l={group:n,theme:e,track:i,rng:s,animated:r};m_[e.style]?.(l);const c=d_(e,s,i);c&&(n.add(c.mesh),r.push(p=>{f_(c.mesh,c.spec,c.anchors,c.phases,c.speeds,p)}));const h=new Lf(e.skyLight,e.groundBounce,1.1);n.add(h);const u=new kr(e.keyColor,e.keyIntensity);u.position.set(40,60,20),u.castShadow=!0,u.shadow.mapSize.set(2048,2048),u.shadow.camera.near=1,u.shadow.camera.far=220,u.shadow.camera.left=-120,u.shadow.camera.right=120,u.shadow.camera.top=120,u.shadow.camera.bottom=-120,u.userData.shadowKey=!0,n.add(u),n.add(u.target);const d=new kr(e.edgeA,.5);d.position.set(-30,20,-40),n.add(d);const f=new Df(e.edgeB,1.1,90);return f.position.set(0,15,0),n.add(f),{group:n,animate:p=>{r.forEach(x=>x(p))}}}const m_={soviet(i){const t=Lt("soviet-silhouette",{color:"#8a2420",roughness:.9}),e=new Tt(mt("soviet-factory",()=>{const n=[],s=new Pe(60,18,8);s.translate(0,9,0),n.push(s);for(let r=0;r<4;r+=1){const a=new Ne(2.2,2.8,30,8);a.translate(-24+r*16,15,0),n.push(a)}return hu(n)}),t);e.position.set(0,0,-190),i.group.add(e)},anime(i){i.group.add(g_(i.track,i.rng))},monet(i){const t=mt("lily-pad",()=>{const a=new rn;return a.absarc(0,0,1,.35,Math.PI*2-.35,!1),a.lineTo(0,0),new Gs(a,12)}),e=Lt("lily-pad",{color:"#5f8f6a",roughness:.85,side:xe}),n=cu(i.track,i.rng,46,20,150,.8,2.4),s=new Ee(t,e,n.length);Ke(s,n.map(a=>({position:a.position.clone().setY(.02),rotationX:-Math.PI/2,rotationY:a.rotationY,scale:a.scale}))),s.name="lily-pads",i.group.add(s);const r=n.filter((a,o)=>o%3===0);if(r.length){const a=new Ee(mt("lily-bloom",()=>new Kn(.35,8,6)),Lt("lily-bloom",{color:"#f5c6d6",roughness:.7,emissive:"#e8a0bf",emissiveIntensity:.08}),r.length);Ke(a,r.map((o,l)=>({position:o.position.clone().setY(.14),rotationY:o.rotationY,scale:.7+l%3*.25}))),i.group.add(a)}}};function jc(i){const t=new ge,e=document.createElement("canvas");e.width=256,e.height=256;const n=e.getContext("2d"),s=n.createLinearGradient(0,0,0,256);s.addColorStop(0,"#ffe600"),s.addColorStop(.45,"#ff6ec7"),s.addColorStop(1,"#b84dff"),n.fillStyle=s,n.beginPath(),n.arc(128,128,110,0,Math.PI*2),n.fill(),n.globalCompositeOperation="destination-out";for(let o=0;o<8;o+=1){const l=140+o*14;n.fillRect(0,l,256,6+o*.5)}const r=new ls(e);r.colorSpace=Re;const a=new Tt(mt("vapor-sun",()=>new Ae(50,50)),new Oe({map:r,transparent:!0,depthWrite:!1,fog:!1}));return t.add(a),t.scale.setScalar(i),t}function g_(i,t){const e=new ge;e.name="power-lines";const n=Lt("power-pole",{color:"#4a4348",roughness:.9}),s=Lt("power-wire",{color:"#2a262c",roughness:.9}),r=mt("power-pole-geo",()=>{const f=new Ne(.14,.2,9,6);return f.translate(0,4.5,0),f}),a=mt("power-cross",()=>new Pe(2.2,.14,.14)),o=26,l=[];for(let f=0;f<o;f+=1){const p=f/o,x=i.sampleAtU(p),g=-(i.roadHalfWidth+3.4);l.push({position:x.position.clone().addScaledVector(x.right,g).setY(0),rotationY:0,scale:1})}const c=new Ee(r,n,l.length),h=new Ee(a,n,l.length);Ke(c,l.map(f=>({position:f.position,rotationY:0,scale:1}))),Ke(h,l.map(f=>({position:f.position.clone().setY(8.4),rotationY:0,scale:1}))),e.add(c,h);const u=[];for(let f=0;f<l.length;f+=1){const p=l[f].position,x=l[(f+1)%l.length].position;for(const g of[-.9,.9]){const m=p.clone().add(x).multiplyScalar(.5);m.y=8.4-.55;const v=new tl(new A(p.x,8.4,p.z).add(new A(g,0,g)),m.add(new A(g*.5,0,g*.5)),new A(x.x,8.4,x.z).add(new A(g,0,g))),M=new el(v,8,.03,4,!1);u.push(M)}}const d=hu(u);return d&&e.add(new Tt(d,s)),e}function hu(i){return i.length===0?null:Vs(i,!1)}function Qc(i,t){return p_(i,t)}function Ua(i,t,e,n,s,r){let a,o;i==="spark"?(a=mt("fx-spark",()=>new Ae(s,s)),o=new Oe({transparent:!0,opacity:r,blending:wi,depthWrite:!1,side:xe,vertexColors:!0})):i==="flame"?(a=mt("fx-flame",()=>new Ae(s,s*1.6)),o=new Oe({transparent:!0,opacity:r,blending:wi,depthWrite:!1,side:xe,vertexColors:!0})):(a=mt("fx-confetti",()=>new Ae(s,s*.6)),o=new Oe({transparent:!0,opacity:.95,depthWrite:!1,side:xe,vertexColors:!0}));const l=new Ee(a,o,t);return l.frustumCulled=!1,l.instanceMatrix.setUsage(mh),{mesh:l,life:new Float32Array(t),maxLife:new Float32Array(t),vel:new Float32Array(t*3),pos:new Float32Array(t*3),scale:new Float32Array(t),cursor:0,count:t,gravity:e,drag:n,colors:new Float32Array(t*3)}}const th=new ee().makeScale(0,0,0);class x_{group=new ge;pools;m=new ee;q=new un;e=new je;s=new A;color=new Nt;constructor(){this.pools={spark:Ua("spark",220,-9,2.5,.22,.9),flame:Ua("flame",160,1.5,3.5,.34,.75),confetti:Ua("confetti",180,-4.5,1.8,.3,.95)};for(const t of Object.values(this.pools)){for(let e=0;e<t.count;e+=1)t.mesh.setMatrixAt(e,th);t.mesh.instanceMatrix.needsUpdate=!0,this.group.add(t.mesh)}this.group.name="effects"}emit(t,e,n,s,r,a,o,l,c,h){const u=this.pools[t],d=u.cursor;u.cursor=(u.cursor+1)%u.count,u.pos[d*3]=e,u.pos[d*3+1]=n,u.pos[d*3+2]=s,u.vel[d*3]=r,u.vel[d*3+1]=a,u.vel[d*3+2]=o,u.life[d]=l,u.maxLife[d]=l,u.scale[d]=c,this.color.set(h),u.colors[d*3]=this.color.r,u.colors[d*3+1]=this.color.g,u.colors[d*3+2]=this.color.b;let f=u.mesh.instanceColor;(!f||f.count!==u.count)&&(f=new Eo(u.colors.slice(),3),u.mesh.instanceColor=f),f.setXYZ(d,this.color.r,this.color.g,this.color.b),f.needsUpdate=!0}emitDriftSparks(t,e,n,s,r){const o=["#7ef2ff","#ffd23f","#ff7eb6"][Math.min(r,2)],l=2+Math.round(s*3);for(let c=0;c<l;c+=1)this.emit("spark",t,e,n,(Math.random()-.5)*4,2+Math.random()*3.5*s,(Math.random()-.5)*4,.3+Math.random()*.35,.7+Math.random()*.6,o)}emitCollisionSparks(t,e,n,s){const r=6+Math.round(s*10);for(let a=0;a<r;a+=1)this.emit("spark",t,e,n,(Math.random()-.5)*9*s,3+Math.random()*5,(Math.random()-.5)*9*s,.25+Math.random()*.3,.8+Math.random()*.7,Math.random()>.4?"#ffe600":"#ffffff")}emitNitroFlame(t,e,n,s,r,a){this.emit("flame",t,e,n,s*.4+(Math.random()-.5)*1.2,.6+Math.random()*1.4,r*.4+(Math.random()-.5)*1.2,.22+Math.random()*.2,.8+Math.random()*.7,a?"#ff7eb6":"#7ef2ff")}emitConfetti(t,e,n){const s=["#ff2d95","#2dfff3","#ffe600","#b84dff","#ff6e40","#00e0a4"];for(let r=0;r<60;r+=1){const a=Math.random()*Math.PI*2,o=Math.random()*7;this.emit("confetti",t+Math.cos(a)*o,e+6+Math.random()*6,n+Math.sin(a)*o,(Math.random()-.5)*5,2+Math.random()*3,(Math.random()-.5)*5,1.6+Math.random()*1.4,.9+Math.random()*.7,s[r%s.length])}}update(t){for(const e of Object.values(this.pools)){let n=!1;for(let s=0;s<e.count;s+=1){if(e.life[s]<=0)continue;n=!0,e.life[s]-=t;const r=1-e.drag*t;e.vel[s*3]*=r,e.vel[s*3+1]=e.vel[s*3+1]*r+e.gravity*t,e.vel[s*3+2]*=r,e.pos[s*3]+=e.vel[s*3]*t,e.pos[s*3+1]+=e.vel[s*3+1]*t,e.pos[s*3+2]+=e.vel[s*3+2]*t,e.pos[s*3+1]<.05&&(e.pos[s*3+1]=.05,e.vel[s*3+1]*=-.25);const a=Math.max(0,e.life[s]/e.maxLife[s]);if(e.life[s]<=0){e.mesh.setMatrixAt(s,th);continue}this.e.set(-Math.PI/2*0+(1-a)*.4,Math.random()*.2,0),this.q.setFromEuler(this.e),this.s.setScalar(e.scale[s]*(.4+a*.8)),this.m.compose(new A(e.pos[s*3],e.pos[s*3+1],e.pos[s*3+2]),this.q,this.s),e.mesh.setMatrixAt(s,this.m)}n&&(e.mesh.instanceMatrix.needsUpdate=!0)}}}class v_{mesh;life;cursor=0;count=320;m=new ee;q=new un;e=new je;s=new A;HIDE=new ee().makeScale(0,0,0);constructor(){const t=mt("skid-quad",()=>new Ae(.34,1.1));t.rotateX(-Math.PI/2);const e=new Oe({color:"#0a0a0e",transparent:!0,opacity:.42,depthWrite:!1});this.mesh=new Ee(t,e,this.count),this.mesh.frustumCulled=!1,this.mesh.instanceMatrix.setUsage(mh),this.life=new Float32Array(this.count);for(let n=0;n<this.count;n+=1)this.mesh.setMatrixAt(n,this.HIDE);this.mesh.renderOrder=3,this.mesh.name="skidmarks"}stamp(t,e,n){const s=this.cursor;this.e.set(0,n,0),this.q.setFromEuler(this.e),this.s.set(1,1,1),this.m.compose(new A(t,.03,e),this.q,this.s),this.mesh.setMatrixAt(s,this.m),this.life[s]=9,this.mesh.instanceMatrix.needsUpdate=!0,this.cursor=(this.cursor+1)%this.count}update(t){let e=!1;for(let n=0;n<this.count;n+=1)this.life[n]<=0||(this.life[n]-=t,this.life[n]<=0&&(this.mesh.setMatrixAt(n,this.HIDE),e=!0));e&&(this.mesh.instanceMatrix.needsUpdate=!0)}}const __=[{body:"#2dfff3",accent:"#ff2d95",emissive:"#2dfff3",name:"NOVA"},{body:"#ffe600",accent:"#b84dff",emissive:"#ffe600",name:"PIXEL"},{body:"#b84dff",accent:"#2dfff3",emissive:"#b84dff",name:"YUZU"}];function y_(i){return{body:i.body,accent:i.accent,emissive:i.emissive,name:i.name}}class M_{constructor(t){this.canvas=t,this.renderer=Nx(t),this.renderer.toneMappingExposure=this.tuning.exposure;const e=document.querySelector("#touch-stick"),n=document.querySelector("#touch-knob"),s=document.querySelector("#boost-button"),r=document.querySelector("#drift-button");this.input=new Dx(e,n,s,r),this.debugTools=new vv(this.tuning,()=>{this.renderer.toneMappingExposure=this.tuning.exposure,Ca(this.renderer,this.camera,this.tuning.maxDpr)}),this.app=new n_({onScreenChange:o=>{this.ui.showScreen(o);const l=o==="results"||o==="cup-standings";this.paused=!l&&o!=="race",document.querySelector("#hud")?.toggleAttribute("hidden",o!=="race"&&o!=="pause")},onSessionStart:o=>this.buildSession(o),onSettingsChange:o=>{this.reducedMotion=o.reducedMotion,document.body.classList.toggle("reduced-motion",o.reducedMotion),this.applyQuality(o.quality),this.audio.setVolumes(o.masterVolume,o.bgmVolume,o.sfxVolume),this.chase.setPreset(o.cameraDistance)},onUnlocksChange:()=>{this.ui.render()}}),this.ui=new Zv(this.app,{onPrimary:()=>{if(this.app.screen==="settings"){this.app.setScreen(this.settingsFrom),this.ui.render();return}this.app.setScreen("menu"),this.ui.render()},onOpenSettings:()=>{this.settingsFrom=this.app.screen==="pause"?"pause":"menu",this.app.setScreen("settings"),this.ui.render()},onQuitToMenu:()=>{this.paused=!0,this.app.setScreen("menu"),this.ui.render()},onResume:()=>{this.paused=!1,this.app.setScreen("race"),this.ui.showScreen("race")},onRestart:()=>{this.paused=!1,this.app.restartSession(),this.ui.showScreen("race")},audio:{menuConfirm:()=>this.audio.menuConfirm(),menuCancel:()=>this.audio.menuCancel(),award:()=>this.audio.award()}}),this.chase=new rv(this.camera),this.chase.setPreset(this.app.settings.cameraDistance,!0),this.track=new Bc(this.app.track),this.track.buildVisuals(),this.race=new Yc(this.track,[],3);const a=Qc(this.track,this.track.def);this.world=a.group,this.worldAnimate=a.animate,this.buildSession({mode:"race",trackId:this.app.trackId,variant:"day",paintId:this.app.paintId,carId:this.app.carId,laps:this.app.settings.laps,difficulty:this.app.settings.difficulty}),this.applyQuality(this.app.settings.quality),this.audio.setVolumes(this.app.settings.masterVolume,this.app.settings.bgmVolume,this.app.settings.sfxVolume),this.reducedMotion=this.app.settings.reducedMotion,document.body.classList.toggle("reduced-motion",this.reducedMotion),this.app.setScreen("menu"),this.ui.render(),this.installTestHooks(),this.publishDiagnostics(),window.__GAME_SCENE__=this.scene}renderer;scene=new Ld;camera=new nn(58,1,.1,500);input;track;cars=[];player;race;audio=new sv;hud=new Iv;chase;world;worldAnimate=null;particles=new x_;skidmarks=new v_;ghostRecorder=new Pv;ghost=null;app;ui;loop=new Ux((t,e)=>this.update(t,e),()=>this.render());tuning={...sl,cameraLag:4.5,exposure:1.1,maxDpr:2};debugTools;frame=0;elapsed=0;pausedForScreenshot=!1;reducedMotion=!1;paused=!1;lastPlayerLap=0;accumulator=0;fixedDt=1/60;boostHits=0;lastBoosting=!1;sessionMode="race";sessionLaps=3;sessionCar=zs("nova");skidTimer=0;start(){this.loop.start()}dispose(){this.loop.stop(),this.input.dispose(),this.audio.dispose(),this.debugTools.dispose(),this.track.dispose(),this.renderer.dispose(),window.__THREE_GAME_DIAGNOSTICS__=void 0,window.__THREE_GAME_TEST_HOOKS__=void 0}applyQuality(t){const e=Rv(t);this.tuning.maxDpr=e.maxDpr,Ca(this.renderer,this.camera,e.maxDpr),this.world.traverse(n=>{n instanceof kr&&(n.castShadow=e.shadows)})}buildSession(t){this.sessionMode=t.mode,this.sessionLaps=t.laps,this.boostHits=0,this.lastBoosting=!1,this.sessionCar=zs(t.carId),this.finishDelay=null,this.scene.remove(this.track.group),this.track.dispose(),this.scene.remove(this.world),this.track=new Bc(this.app.sessionTrack()),this.track.buildVisuals();const e=Qc(this.track,this.track.def);this.world=e.group,this.worldAnimate=e.animate,this.scene.fog=new qo(this.track.def.theme.fog,this.track.def.theme.fogDensity),this.scene.add(this.track.group),this.scene.add(this.world);for(const c of this.cars)this.scene.remove(c.group);this.cars=[];const n=y_(lu(t.paintId));n.name="YOU";const s=Xv(this.sessionCar,this.tuning,this.app.loadoutFor(t.carId));this.player=new Fc(this.track,0,n,!0,s),this.player.onMiniTurbo=(c,h,u)=>{this.audio.miniTurbo(c),this.reducedMotion||this.chase.addTrauma(.08);const d=new A(Math.sin(u.heading),0,Math.cos(u.heading)).multiplyScalar(-2);this.particles.emitNitroFlame(u.position.x+d.x,.5,u.position.z+d.z,d.x*4,d.z*4,c===2),this.hud.flashDrift?.(h,c)},this.player.onCollision=(c,h)=>{c>.15&&(this.particles.emitCollisionSparks(h.position.x,.5,h.position.z,c),h.isPlayer&&this.audio.impact())},this.cars.push(this.player),t.mode!=="time-trial"&&__.forEach((c,h)=>{this.cars.push(new Fc(this.track,h+1,c,!1))}),this.race=new Yc(this.track,this.cars,t.laps,t.difficulty),this.race.onCountdownBeep=()=>this.audio.countdownBeep(),this.race.onGo=()=>this.audio.goBeep(),t.mode==="time-trial"&&this.race.setTimeTrial(!0);const a=this.app.loadoutFor(t.carId),o={tire:di(a.tire).visual,rim:di(a.rim).visual,spoiler:di(a.spoiler).visual,exhaust:di(a.exhaust).visual};for(const c of this.cars)c.attachVisual(this.track.def.theme.edgeA,this.sessionCar.body,c.isPlayer?o:void 0),this.scene.add(c.group);this.ghost||(this.ghost=new Lv),t.mode==="time-trial"&&this.ghost.loadFor(this.track.def.id,this.sessionCar.body)?this.scene.add(this.ghost.group):this.ghost.clear(),this.ghostRecorder.stop(),this.audio.startBgmForTheme(this.track.def.theme),this.chase.snapTo(this.player.position,this.player.heading),this.lastPlayerLap=-1,this.paused=!1,this.hud.update(this.snapshotHud(this.race.getState())),this.publishDiagnostics()}update(t,e){if(this.frame+=1,this.pausedForScreenshot){this.publishDiagnostics();return}const n=this.input.readIntent();if(n.restart&&(this.app.screen==="race"||this.app.screen==="results")){this.app.restartSession(),this.ui.showScreen("race"),this.hud.flashCountdown?.();return}if(n.pause&&(this.app.screen==="race"&&this.race.phase==="racing"?(this.paused=!0,this.app.setScreen("pause"),this.ui.render()):this.app.screen==="pause"&&(this.paused=!1,this.app.setScreen("race"),this.ui.showScreen("race"))),n.camera&&this.app.screen==="race"){const c=this.app.cycleCameraDistance();this.chase.setPreset(c),this.audio.menuConfirm()}const s=this.app.screen==="results"||this.app.screen==="cup-standings";if(this.paused||this.app.screen!=="race"&&!s){this.chase.update(0,this.player.position,this.player.heading,this.player.speed,!1,!1),this.render(),this.publishDiagnostics();return}Ca(this.renderer,this.camera,this.tuning.maxDpr),this.elapsed+=this.paused?0:t;const r=t;for(this.accumulator=Math.min(this.accumulator+r,.1);this.accumulator>=this.fixedDt;){const c=this.race.phase==="racing"&&this.app.screen==="race";c?(this.applyIntentToPlayer(n),this.ghostRecorder.tick(this.fixedDt,this.player)):(this.player.controls.throttle=0,this.player.controls.steer=0,this.player.controls.brake=!1,this.player.controls.drift=!1,this.player.controls.boost=!1);for(const f of this.cars)f.update(this.fixedDt,c);this.race.update(this.fixedDt);const h=this.lastBoosting,u=this.player.controls.boost&&this.player.boost>.2;u&&!h&&(this.boostHits+=1,this.audio.boost(),this.flashBoost(!0)),this.lastBoosting=u,this.accumulator-=this.fixedDt;const d=this.player;if(d.drifting&&!this.reducedMotion&&(this.skidTimer+=d.speed*this.fixedDt,this.skidTimer>=1.4)){this.skidTimer=0;const f=d.group.rotation.y,p=Math.sin(f),x=Math.cos(f);for(const g of[-1,1]){const m=g*.9,v=-1.45,M=d.position.x+m*x+v*p,S=d.position.z-m*p+v*x;this.skidmarks.stamp(M,S,f),this.particles.emitDriftSparks(M,.18,S,Math.abs(d.lateralSpeed)/14,d.driftTier)}}if(u&&!this.reducedMotion){const f=d.group.rotation.y,p=Math.sin(f),x=Math.cos(f);for(const g of[-1,1]){const m=g*.4;-this.sessionCar.body;const v=d.position.x+m*x-2.2*p,M=d.position.z-m*p-2.2*x;this.particles.emitNitroFlame(v,.45,M,-p*6,-x*6,d.driftTier===2)}}}if(this.player.lap>this.lastPlayerLap&&this.race.phase==="racing")if(this.player.lap===0)this.lastPlayerLap=0,this.ghostRecorder.start();else{this.lastPlayerLap=this.player.lap;const c=this.player.bestLap===this.player.lastLap;this.race.flashMessage(c?`BEST ${Na(this.player.lastLap)}`:`LAP ${Na(this.player.lastLap)}`),this.audio.lap(),this.chase.addTrauma(.25),this.sessionMode==="time-trial"&&(this.ghostRecorder.maybeSave(this.track.def.id,this.player.lastLap,this.sessionCar.body)&&this.ghost&&(this.ghost.loadFor(this.track.def.id,this.sessionCar.body),this.scene.children.includes(this.ghost.group)||this.scene.add(this.ghost.group)),this.ghostRecorder.start())}const a=this.reducedMotion?0:e;this.worldAnimate?.(a);const o=this.player.controls.boost&&this.player.boost>0&&this.player.controls.throttle>.1;this.chase.update(this.paused?0:t,this.player.position,this.player.heading,this.player.speed,this.player.drifting,o),this.player.collisionFlash>.9&&this.lastCollisionFlash<=.9&&this.chase.addTrauma(.15),this.lastCollisionFlash=this.player.collisionFlash,this.updateJuice(o),this.particles.update(this.reducedMotion?0:t),this.skidmarks.update(t),this.ghost?.update(this.player.lapTime),this.world.traverse(c=>{c instanceof kr&&c.userData?.shadowKey&&(c.target.position.copy(this.player.position),c.target.updateMatrixWorld(),c.position.copy(this.player.position).add(new A(40,60,20)))});const l=this.race.getState();this.audio.updateEngine(ke.clamp(this.player.speed/50,0,1),this.player.drifting,o&&this.player.boost>0,this.race.phase!=="finished"&&!this.paused),this.hud.update(this.snapshotHud(l)),this.publishDiagnostics(),l.phase==="finished"&&this.app.screen==="race"&&(this.finishDelay===null&&(this.finishDelay=2.4,this.audio.award(),l.playerPosition===1&&!this.reducedMotion&&this.particles.emitConfetti(this.player.position.x,1.5,this.player.position.z)),this.finishDelay-=t,this.finishDelay<=0&&(this.audio.menuConfirm(),this.finishSession(l)))}finishDelay=null;settingsFrom="menu";lastCollisionFlash=0;finishSession(t){const e=t.playerPosition,n=t.standings.map(l=>l.index),s=eu(this.track.def.id,this.player.bestLap),r=_v(this.sessionMode,e,s,t.standings.length);this.sessionMode==="challenge"&&this.app.recordChallenge(Vn(),this.player.bestLap);const a=!this.app.unlocks.hardDifficulty;this.app.completeRace({position:e,bestLap:t.playerBestLap||this.player.bestLap,trackId:this.track.def.id,boostHits:this.boostHits,driftScore:Math.round(this.player.driftScore),stars:r,distance:Math.round(this.track.length*Math.max(this.player.lap,this.sessionLaps)),order:n}),a&&this.app.unlocks.hardDifficulty&&this.ui.toast("🏆 夺冠！困难难度已解锁");const o=this.sessionMode==="challenge"?` · 挑战码 ${ou(Vn(),this.player.bestLap)}`:"";this.ui.setResultsDetail(`名次 ${e}/${t.standings.length} · 最佳圈 ${Na(t.playerBestLap||this.player.bestLap)} · 氮气 ${this.boostHits} · 漂移分 ${Math.round(this.player.driftScore)}${o}`)}updateJuice(t){const e=ke.clamp(this.player.speed/50,0,1),n=document.querySelector("#speed-lines"),s=document.querySelector("#chroma"),r=document.querySelector("#boost-flash");if(!n||!s||!r)return;const a=e>.35||this.player.drifting;n.classList.toggle("on",a&&!this.reducedMotion),n.classList.toggle("boost",t&&!this.reducedMotion),s.classList.toggle("on",(this.player.drifting||t)&&!this.reducedMotion),r.classList.toggle("on",t&&!this.reducedMotion),a&&(n.style.opacity=String(.25+e*.75))}flashBoost(t){const e=document.querySelector("#boost-flash");e&&e.classList.toggle("on",t&&!this.reducedMotion)}applyIntentToPlayer(t){const e=this.app.settings.autoThrottle;this.player.controls.throttle=e?Math.max(t.throttle,.55):t.throttle;let n=t.steer;this.app.settings.assistSteer&&Math.abs(n)>.01&&(n=ke.clamp(n*1.05,-1,1)),this.player.controls.steer=n,this.player.controls.brake=t.brake,this.player.controls.drift=t.drift,this.player.controls.boost=t.boost}snapshotHud(t){return{speedKph:this.player.speed*3.6,boost:this.player.boost,drifting:this.player.drifting,driftTier:this.player.driftTier,driftChain:this.player.driftChain,driftScore:Math.round(this.player.driftScore),lap:t.playerLap,totalLaps:t.totalLaps,position:this.sessionMode==="time-trial"?1:t.playerPosition,fieldSize:this.sessionMode==="time-trial"?1:this.cars.length,raceTime:t.raceTime,currentLapTime:this.player.lapTime,bestLap:t.playerBestLap,lastLap:t.playerLastLap,countdown:t.phase==="countdown"?Math.max(1,Math.ceil(t.countdown-.5)):0,message:t.message,phase:t.phase,standings:this.sessionMode==="time-trial"?[{name:"YOU",isPlayer:!0,lap:t.playerLap,paint:this.player.paint.body}]:t.standings.map(e=>({name:e.name,isPlayer:e.isPlayer,lap:e.lap,paint:e.paint}))}}render(){this.renderer.render(this.scene,this.camera)}installTestHooks(){window.__THREE_GAME_TEST_HOOKS__={seed:t=>{},setState:t=>{if(t!=="active-play"&&t!=="complete"&&t!=="title")throw new Error(`Unknown test state: ${t}`);if(t==="title")return this.app.setScreen("menu"),this.ui.render(),this.render(),this.publishDiagnostics(),{state:t};if(this.app.setScreen("race"),this.ui.showScreen("race"),this.paused=!1,this.race.reset(),t==="active-play"){this.race.phase="racing",this.race.countdown=0,this.race.raceTime=12.4,this.player.controls.throttle=1,this.player.controls.steer=.25,this.player.controls.drift=!0,this.player.boost=.8,this.player.position.copy(this.track.pointAt(.15,-1.5));const e=this.track.getSample(Math.floor(.15*400));this.player.heading=Math.atan2(e.tangent.x,e.tangent.z),this.player.velocity.copy(this.player.getForward().multiplyScalar(32)),this.player.speed=32,this.player.drifting=!0,this.chase.snapTo(this.player.position,this.player.heading);for(const n of this.cars)n.update(this.fixedDt,!0)}if(t==="complete"){this.race.phase="racing",this.race.countdown=0;for(const e of this.cars)e.lap=this.sessionLaps;for(const e of this.cars)e.unwrappedProgress=this.sessionLaps+.05}return this.hud.update(this.snapshotHud(this.race.getState())),this.render(),this.publishDiagnostics(),{state:t}},setPausedForScreenshot:t=>{this.pausedForScreenshot=t},setReducedMotion:t=>{this.reducedMotion=t,this.render(),this.publishDiagnostics()},hideDebugUi:t=>{this.debugTools.setHidden(t)},forceFinish:t=>{this.race.phase="racing";for(const e of this.cars)e.velocity.set(0,0,0),e.lap=this.sessionLaps,e.unwrappedProgress=this.sessionLaps+.05;return t&&(this.player.unwrappedProgress=this.sessionLaps+.5),t},driveTo:t=>{const e=(t%1+1)%1,n=this.track.getSample(Math.floor(e*400));return this.player.position.copy(n.position).addScaledVector(n.right,-1.5),this.player.heading=Math.atan2(n.tangent.x,n.tangent.z),this.player.velocity.copy(this.player.getForward()).multiplyScalar(28),{lap:this.player.lap,unwrapped:Math.round(this.player.unwrappedProgress*1e3)/1e3}},forceGhost:(t,e)=>{const s=[];for(let r=0;r<=220;r+=1){const a=this.track.getSample(Math.floor(r/220*400));s.push(Math.round(a.position.x*100)/100,Math.round(a.position.z*100)/100,Math.round(Math.atan2(a.tangent.x,a.tangent.z)*1e3)/1e3)}try{return localStorage.setItem(ol(this.track.def.id),JSON.stringify({dt:.1,samples:s,seconds:e,body:"coupe"})),!0}catch{return!1}}}}publishDiagnostics(){const t=this.renderer.info;window.__THREE_GAME_DIAGNOSTICS__={frame:this.frame,elapsed:this.elapsed,score:this.player.lap,targetScore:this.race.totalLaps,complete:this.race.phase==="finished",screen:this.app.screen,track:this.track.def.id,player:{position:{x:this.player.position.x,y:this.player.position.y,z:this.player.position.z},speed:this.player.speed,drifting:this.player.drifting,boost:this.player.boost},ai:this.race.getAiDebug(),raceTime:this.race.raceTime,phase:this.race.phase,renderer:{calls:t.render.calls,triangles:t.render.triangles,geometries:t.memory.geometries,textures:t.memory.textures},canvas:{clientWidth:this.canvas.clientWidth,clientHeight:this.canvas.clientHeight,width:this.canvas.width,height:this.canvas.height,dpr:Math.min(window.devicePixelRatio||1,this.tuning.maxDpr)}}}}function Na(i){return`${i.toFixed(2)}s`}const uu=document.querySelector("#game-canvas");if(!uu)throw new Error("Missing #game-canvas element.");const S_=new M_(uu);S_.start();
