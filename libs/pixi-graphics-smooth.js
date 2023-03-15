/*!
 * @pixi/graphics-smooth - v1.0.0
 * Compiled Mon, 13 Mar 2023 22:01:44 UTC
 *
 * @pixi/graphics-smooth is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 * 
 * Copyright 2023, Ivan Popelyshev, All Rights Reserved
 */this.PIXI=this.PIXI||{},this.PIXI.smooth=function(I,v,O,$){"use strict";function K(a,t,s=.001){return this===t||Math.abs(a.a-t.a)<s&&Math.abs(a.b-t.b)<s&&Math.abs(a.c-t.c)<s&&Math.abs(a.d-t.d)<s&&Math.abs(a.tx-t.tx)<s&&Math.abs(a.ty-t.ty)<s}class nt{constructor(){this.textureIds=[],this.matrices=[],this.lines=[],this.count=0}clear(){for(let t=0;t<this.count;t++)this.textureIds[t]=null,this.matrices[t]=null;this.count=0}add(t,s,e,n,i,r){const{textureIds:l,matrices:c,lines:p,count:u}=this;t=t*4+i;for(let o=0;o<u;o++)if(p[o*2]===e&&p[o*2+1]===n&&l[o]===t&&K(c[o],s))return o;return u>=r.maxStyles?-1:(l[u]=t,c[u]=s,p[u*2]=e,p[u*2+1]=n,this.count++,u)}}class Z{constructor(){this.texArray=new v.BatchTextureArray,this.styleArray=new nt,this.shader=null,this.blend=v.BLEND_MODES.NORMAL,this.start=0,this.size=0,this.TICK=0,this.settings=null,this.data=null}clear(){this.texArray.clear(),this.styleArray.clear(),this.settings=null,this.data=null,this.shader=null}begin(t,s){this.TICK=++v.BaseTexture._globalBatch,this.settings=t,this.shader=s,this.start=0,this.size=0,this.data=null,s&&s.settings&&(this.settings=s.settings)}check(t){return this.size===0?(this.shader=t,!0):this.shader===t}add(t,s,e,n,i){const{texArray:r,TICK:l,styleArray:c,settings:p}=this,{baseTexture:u}=t;if(u._batchEnabled!==l&&r.count===p.maxTextures)return-1;const o=u._batchEnabled!==l?r.count:u._batchLocation,h=c.add(o,s||v.Matrix.IDENTITY,e,n,i,p);return h>=0&&u._batchEnabled!==l&&(u._batchEnabled=l,u._batchLocation=r.count,r.elements[r.count++]=u),h}}class at{constructor(){this.reset()}begin(t,s,e){this.reset(),this.style=t,this.start=s,this.attribStart=e,this.jointEnd=0}end(t,s){this.attribSize=s-this.attribStart,this.size=t-this.start}reset(){this.style=null,this.size=0,this.start=0,this.attribStart=0,this.attribSize=0,this.styleId=-1,this.rgba=0,this.jointEnd=0}}class J{constructor(){this.reset()}toJSON(){return this.copyTo({})}clone(){return this.copyTo(new J)}copyTo(t){return t.color=this.color,t.alpha=this.alpha,t.texture=this.texture,t.matrix=this.matrix,t.shader=this.shader,t.visible=this.visible,t.smooth=this.smooth,t.matrixTex=null,t}packLineScale(){return 0}reset(){this.color=16777215,this.alpha=1,this.texture=v.Texture.WHITE,this.matrix=null,this.shader=null,this.visible=!1,this.smooth=!1,this.matrixTex=null}destroy(){this.texture=null,this.matrix=null,this.matrixTex=null}getTextureMatrix(){const t=this.texture;return this.matrix?t.frame.width===t.baseTexture.width&&t.frame.height===t.baseTexture.height?this.matrix:(this.matrixTex?this.matrixTex.copyFrom(this.matrix):this.matrixTex=this.matrix.clone(),this.matrixTex.translate(Number(t.frame.x),Number(t.frame.y)),this.matrixTex):null}}var C=(a=>(a.NONE="none",a.NORMAL="normal",a.HORIZONTAL="horizontal",a.VERTICAL="vertical",a))(C||{});class Y extends J{clone(){return this.copyTo(new Y)}copyTo(t){return t.color=this.color,t.alpha=this.alpha,t.texture=this.texture,t.matrix=this.matrix,t.shader=this.shader,t.visible=this.visible,t.width=this.width,t.alignment=this.alignment,t.cap=this.cap,t.join=this.join,t.miterLimit=this.miterLimit,t.scaleMode=this.scaleMode,t}packLineScale(){switch(this.scaleMode){case"normal":return 1;case"horizontal":return 2;case"vertical":return 3;default:return 0}}reset(){super.reset(),this.smooth=!0,this.color=0,this.width=0,this.alignment=.5,this.cap=O.LINE_CAP.BUTT,this.join=O.LINE_JOIN.MITER,this.miterLimit=10,this.scaleMode="normal"}}class rt{constructor(){this.verts=[],this.joints=[],this.vertexSize=0,this.indexSize=0,this.closePointEps=1e-4}clear(){this.verts.length=0,this.joints.length=0,this.vertexSize=0,this.indexSize=0}destroy(){this.verts.length=0,this.joints.length=0}}var f=(a=>(a[a.NONE=0]="NONE",a[a.FILL=1]="FILL",a[a.JOINT_BEVEL=4]="JOINT_BEVEL",a[a.JOINT_MITER=8]="JOINT_MITER",a[a.JOINT_ROUND=12]="JOINT_ROUND",a[a.JOINT_CAP_BUTT=16]="JOINT_CAP_BUTT",a[a.JOINT_CAP_SQUARE=18]="JOINT_CAP_SQUARE",a[a.JOINT_CAP_ROUND=20]="JOINT_CAP_ROUND",a[a.FILL_EXPAND=24]="FILL_EXPAND",a[a.CAP_BUTT=32]="CAP_BUTT",a[a.CAP_SQUARE=64]="CAP_SQUARE",a[a.CAP_ROUND=96]="CAP_ROUND",a[a.CAP_BUTT2=128]="CAP_BUTT2",a))(f||{});const R=class{constructor(){this.strideFloats=12,this.bufferPos=0,this.indexPos=0}updateBufferSize(a,t,s,e){const{joints:n}=e;let i=!1,r=0,l=0;for(let c=a;c<a+t;c++){const p=n[c]&-32,u=n[c]&31;if(u===f.FILL){i=!0,r++;continue}if(u>=f.FILL_EXPAND){r+=3,l+=3;continue}const o=R.vertsByJoint[u]+R.vertsByJoint[p];o>=4&&(r+=o,l+=6+3*Math.max(o-6,0))}i&&(l+=s),e.vertexSize+=r,e.indexSize+=l}beginPack(a,t,s,e,n=0,i=0){this.buildData=a,this.bufFloat=t,this.bufUint=s,this.indices=e,this.bufferPos=n,this.indexPos=i}endPack(){this.buildData=null,this.bufFloat=null,this.bufUint=null,this.indices=null}packInterleavedGeometry(a,t,s,e,n){const{bufFloat:i,bufUint:r,indices:l,buildData:c,strideFloats:p}=this,{joints:u,verts:o}=c;let h=this.bufferPos,d=this.indexPos,m=this.bufferPos/this.strideFloats,x,y,g,L,E,P,S,b,N=!1,T=0;for(let _=a;_<a+t;_++){const M=u[_],q=u[_]&-32,D=u[_]&31;if(D===f.FILL){N=!0,x=o[_*2],y=o[_*2+1],i[h]=x,i[h+1]=y,i[h+2]=x,i[h+3]=y,i[h+4]=x,i[h+5]=y,i[h+6]=x,i[h+7]=y,i[h+8]=T,i[h+9]=16*D,i[h+10]=e,r[h+11]=n,h+=p;continue}if(D>=f.FILL_EXPAND){E=o[_*2],P=o[_*2+1],x=o[_*2+2],y=o[_*2+3],g=o[_*2+4],L=o[_*2+5];const B=_+3;for(let V=0;V<3;V++)i[h]=E,i[h+1]=P,i[h+2]=x,i[h+3]=y,i[h+4]=g,i[h+5]=L,i[h+6]=o[(B+V)*2],i[h+7]=o[(B+V)*2+1],i[h+8]=T,i[h+9]=16*M+V,i[h+10]=e,r[h+11]=n,h+=p;l[d]=m,l[d+1]=m+1,l[d+2]=m+2,d+=3,m+=3;continue}const w=R.vertsByJoint[D]+R.vertsByJoint[q];if(w===0)continue;x=o[_*2],y=o[_*2+1],g=o[_*2+2],L=o[_*2+3],E=o[_*2-2],P=o[_*2-1];const H=Math.sqrt((g-x)*(g-x)+(L-y)*(L-y));R.vertsByJoint[D]===0&&(T-=H),(D&-3)!==f.JOINT_CAP_BUTT?(S=o[_*2+4],b=o[_*2+5]):(S=x,b=y);for(let B=0;B<w;B++)i[h]=E,i[h+1]=P,i[h+2]=x,i[h+3]=y,i[h+4]=g,i[h+5]=L,i[h+6]=S,i[h+7]=b,i[h+8]=T,i[h+9]=16*M+B,i[h+10]=e,r[h+11]=n,h+=p;T+=H,l[d]=m,l[d+1]=m+1,l[d+2]=m+2,l[d+3]=m,l[d+4]=m+2,l[d+5]=m+3,d+=6;for(let B=5;B+1<w;B++)l[d]=m+4,l[d+1]=m+B,l[d+2]=m+B+1,d+=3;m+=w}if(N){for(let _=0;_<s.length;_++)l[d+_]=s[_]+m;d+=s.length}this.bufferPos=h,this.indexPos=d}};let G=R;G.vertsByJoint=[];const A=G.vertsByJoint;for(let a=0;a<256;a++)A.push(0);A[f.FILL]=1;for(let a=0;a<8;a++)A[f.FILL_EXPAND+a]=3;A[f.JOINT_BEVEL]=4+5,A[f.JOINT_BEVEL+1]=4+5,A[f.JOINT_BEVEL+2]=4+5,A[f.JOINT_BEVEL+3]=4+5,A[f.JOINT_ROUND]=4+5,A[f.JOINT_ROUND+1]=4+5,A[f.JOINT_ROUND+2]=4+5,A[f.JOINT_ROUND+3]=4+5,A[f.JOINT_MITER]=4+5,A[f.JOINT_MITER+1]=4+5,A[f.JOINT_MITER+2]=4,A[f.JOINT_MITER+3]=4,A[f.JOINT_CAP_BUTT]=4,A[f.JOINT_CAP_BUTT+1]=4,A[f.JOINT_CAP_SQUARE]=4,A[f.JOINT_CAP_SQUARE+1]=4,A[f.JOINT_CAP_ROUND]=4+5,A[f.JOINT_CAP_ROUND+1]=4+5,A[f.CAP_ROUND]=4;class z{constructor(t,s=null,e=null,n=null){this.shape=t,this.lineStyle=e,this.fillStyle=s,this.matrix=n,this.type=t.type,this.points=[],this.holes=[],this.triangles=[],this.closeStroke=!1,this.clearBuild()}clearPath(){this.points.length=0,this.closeStroke=!0}clearBuild(){this.triangles.length=0,this.fillStart=0,this.fillLen=0,this.strokeStart=0,this.strokeLen=0,this.fillAA=!1}clone(){return new z(this.shape,this.fillStyle,this.lineStyle,this.matrix)}capType(){let t;switch(this.lineStyle.cap){case O.LINE_CAP.SQUARE:t=f.CAP_SQUARE;break;case O.LINE_CAP.ROUND:t=f.CAP_ROUND;break;default:t=f.CAP_BUTT;break}return t}goodJointType(){let t;switch(this.lineStyle.join){case O.LINE_JOIN.BEVEL:t=f.JOINT_BEVEL;break;case O.LINE_JOIN.ROUND:t=f.JOINT_ROUND;break;default:t=f.JOINT_MITER+3;break}return t}jointType(){let t;switch(this.lineStyle.join){case O.LINE_JOIN.BEVEL:t=f.JOINT_BEVEL;break;case O.LINE_JOIN.ROUND:t=f.JOINT_ROUND;break;default:t=f.JOINT_MITER;break}return t}destroy(){this.shape=null,this.holes.length=0,this.holes=null,this.points.length=0,this.points=null,this.lineStyle=null,this.fillStyle=null,this.triangles=null}}class W{path(t,s){const e=t.points;let n,i,r,l,c,p;if(t.type===v.SHAPES.CIRC){const y=t.shape;n=y.x,i=y.y,c=p=y.radius,r=l=0}else if(t.type===v.SHAPES.ELIP){const y=t.shape;n=y.x,i=y.y,c=y.width,p=y.height,r=l=0}else{const y=t.shape,g=y.width/2,L=y.height/2;n=y.x+g,i=y.y+L,c=p=Math.max(0,Math.min(y.radius,Math.min(g,L))),r=g-c,l=L-p}if(!(c>=0&&p>=0&&r>=0&&l>=0)){e.length=0;return}const u=Math.ceil(2.3*Math.sqrt(c+p)),o=u*8+(r?4:0)+(l?4:0);if(e.length=o,o===0)return;if(u===0){e.length=8,e[0]=e[6]=n+r,e[1]=e[3]=i+l,e[2]=e[4]=n-r,e[5]=e[7]=i-l;return}let h=0,d=u*4+(r?2:0)+2,m=d,x=o;{const y=r+c,g=l,L=n+y,E=n-y,P=i+g;if(e[h++]=L,e[h++]=P,e[--d]=P,e[--d]=E,l){const S=i-g;e[m++]=E,e[m++]=S,e[--x]=S,e[--x]=L}}for(let y=1;y<u;y++){const g=Math.PI/2*(y/u),L=r+Math.cos(g)*c,E=l+Math.sin(g)*p,P=n+L,S=n-L,b=i+E,N=i-E;e[h++]=P,e[h++]=b,e[--d]=b,e[--d]=S,e[m++]=S,e[m++]=N,e[--x]=N,e[--x]=P}{const y=r,g=l+p,L=n+y,E=n-y,P=i+g,S=i-g;e[h++]=L,e[h++]=P,e[--x]=S,e[--x]=L,r&&(e[h++]=E,e[h++]=P,e[--x]=S,e[--x]=E)}}fill(t,s){const{verts:e,joints:n}=s,{points:i,triangles:r}=t;if(i.length===0)return;let l,c;if(t.type!==v.SHAPES.RREC){const b=t.shape;l=b.x,c=b.y}else{const b=t.shape;l=b.x+b.width/2,c=b.y+b.height/2}const p=t.matrix,u=p?p.a*l+p.c*c+p.tx:l,o=p?p.b*l+p.d*c+p.ty:c;let h=1;const d=0;if(!t.fillAA){e.push(u,o),n.push(f.FILL),e.push(i[0],i[1]),n.push(f.FILL);for(let b=2;b<i.length;b+=2)e.push(i[b],i[b+1]),n.push(f.FILL),r.push(h++,d,h);r.push(d+1,d,h);return}const m=i.length;let x=i[m-2],y=i[m-1],g=y-i[m-3],L=i[m-4]-x;const E=Math.sqrt(g*g+L*L);g/=E,L/=E;let P,S;for(let b=0;b<m;b+=2){const N=i[b],T=i[b+1];let _=T-y,M=x-N;const q=Math.sqrt(_*_+M*M);_/=q,M/=q;let D=g+_,w=L+M;const H=_*D+M*w;D/=H,w/=H,b>0?(e.push(D),e.push(w)):(P=D,S=w),e.push(u),e.push(o),e.push(x),e.push(y),e.push(N),e.push(T),e.push(0),e.push(0),e.push(D),e.push(w),n.push(f.FILL_EXPAND+2),n.push(f.NONE),n.push(f.NONE),n.push(f.NONE),n.push(f.NONE),n.push(f.NONE),x=N,y=T,g=_,L=M}e.push(P),e.push(S)}line(t,s){const{verts:e,joints:n}=s,{points:i}=t,r=i.length===8?t.goodJointType():f.JOINT_MITER+3,l=i.length;if(l!==0){e.push(i[l-2],i[l-1]),n.push(f.NONE);for(let c=0;c<l;c+=2)e.push(i[c],i[c+1]),n.push(r);e.push(i[0],i[1]),n.push(f.NONE),e.push(i[2],i[3]),n.push(f.NONE)}}}const pt=[];function lt(a,t=!1){const s=a.length;if(s<6)return;let e=0;for(let n=0,i=a[s-2],r=a[s-1];n<s;n+=2){const l=a[n],c=a[n+1];e+=(l-i)*(c+r),i=l,r=c}if(!t&&e>0||t&&e<=0){const n=s/2;for(let i=n+n%2;i<s;i+=2){const r=s-i-2,l=s-i-1,c=i,p=i+1;[a[r],a[c]]=[a[c],a[r]],[a[l],a[p]]=[a[p],a[l]]}}}class tt{path(t,s){const e=t.shape,n=t.points=e.points.slice(),i=s.closePointEps,r=i*i;if(n.length===0)return;const l=new v.Point(n[0],n[1]),c=new v.Point(n[n.length-2],n[n.length-1]),p=t.closeStroke=e.closeStroke;let u=n.length,o=2;for(let h=2;h<u;h+=2){const d=n[h-2],m=n[h-1],x=n[h],y=n[h+1];let g=!0;Math.abs(d-x)<i&&Math.abs(m-y)<i&&(g=!1),g&&(n[o]=n[h],n[o+1]=n[h+1],o+=2)}n.length=u=o,o=2;for(let h=2;h+2<u;h+=2){let d=n[h-2],m=n[h-1];const x=n[h],y=n[h+1];let g=n[h+2],L=n[h+3];d-=x,m-=y,g-=x,L-=y;let E=!0;Math.abs(g*m-L*d)<r&&d*g+m*L<-r&&(E=!1),E&&(n[o]=n[h],n[o+1]=n[h+1],o+=2)}n[o]=n[u-2],n[o+1]=n[u-1],o+=2,n.length=u=o,!(u<=2)&&p&&Math.abs(l.x-c.x)<i&&Math.abs(l.y-c.y)<i&&(n.pop(),n.pop())}line(t,s){const{closeStroke:e,points:n}=t,i=n.length;if(i<=2)return;const{verts:r,joints:l}=s,c=t.jointType(),p=t.capType();let u=0,o,h;e?(o=n[i-2],h=n[i-1],l.push(f.NONE)):(o=n[2],h=n[3],p===f.CAP_ROUND?(r.push(n[0],n[1]),l.push(f.NONE),l.push(f.CAP_ROUND),u=0):(u=p,l.push(f.NONE))),r.push(o,h);for(let d=0;d<i;d+=2){const m=n[d],x=n[d+1];let y=c;d+2>=i?e||(y=f.NONE):d+4>=i&&(e||(p===f.CAP_ROUND&&(y=f.JOINT_CAP_ROUND),p===f.CAP_BUTT&&(y=f.JOINT_CAP_BUTT),p===f.CAP_SQUARE&&(y=f.JOINT_CAP_SQUARE))),y+=u,u=0,r.push(m,x),l.push(y),o=m,h=x}e?(r.push(n[0],n[1]),l.push(f.NONE),r.push(n[2],n[3]),l.push(f.NONE)):(r.push(n[i-4],n[i-3]),l.push(f.NONE))}fill(t,s){let e=t.points;const n=t.holes,i=s.closePointEps,{verts:r,joints:l}=s;if(e.length<6)return;const c=[];let p=e.length;lt(e,!1);for(let d=0;d<n.length;d++){const m=n[d];lt(m.points,!0),c.push(e.length/2),e=e.concat(m.points)}const u=pt;u.length<e.length&&(u.length=e.length);let o=0;for(let d=0;d<=c.length;d++){let m=p/2;d>0&&(d<c.length?m=c[d]:m=e.length>>1),u[o*2]=m-1,u[(m-1)*2+1]=o;for(let x=o;x+1<m;x++)u[x*2+1]=x+1,u[x*2+2]=x;o=m}if(t.triangles=v.utils.earcut(e,c,2),!t.triangles)return;if(!t.fillAA){for(let d=0;d<e.length;d+=2)r.push(e[d],e[d+1]),l.push(f.FILL);return}const{triangles:h}=t;p=e.length;for(let d=0;d<h.length;d+=3){let m=0;for(let x=0;x<3;x++){const y=h[d+x],g=h[d+(x+1)%3];(u[y*2]===g||u[y*2+1]===g)&&(m|=1<<x)}l.push(f.FILL_EXPAND+m),l.push(f.NONE),l.push(f.NONE),l.push(f.NONE),l.push(f.NONE),l.push(f.NONE)}for(let d=0;d<p/2;d++){const m=u[d*2],x=u[d*2+1];let y=e[x*2+1]-e[d*2+1],g=-(e[x*2]-e[d*2]),L=e[d*2+1]-e[m*2+1],E=-(e[d*2]-e[m*2]);const P=Math.sqrt(y*y+g*g);y/=P,g/=P;const S=Math.sqrt(L*L+E*E);L/=S,E/=S;let b=y+L,N=g+E;const T=b*y+N*g;Math.abs(T)<i?(b=y,N=g):(b/=T,N/=T),u[d*2]=b,u[d*2+1]=N}for(let d=0;d<h.length;d+=3){const m=h[d],x=h[d+1],y=h[d+2],g=e[y*2+1]-e[x*2+1],L=-(e[y*2]-e[x*2]),E=e[x*2+1]-e[m*2+1],P=-(e[x*2]-e[m*2]);let S=1;g*P-E*L>0&&(S=2);for(let b=0;b<3;b++){const N=h[d+b*S%3];r.push(e[N*2],e[N*2+1])}for(let b=0;b<3;b++){const N=h[d+b*S%3];r.push(u[N*2],u[N*2+1])}}}}class ht{constructor(){this._polyBuilder=new tt}path(t,s){const e=t.shape,n=e.x,i=e.y,r=e.width,l=e.height,c=t.points;c.length=0,c.push(n,i,n+r,i,n+r,i+l,n,i+l)}line(t,s){const{verts:e,joints:n}=s,{points:i}=t,r=t.goodJointType(),l=i.length;e.push(i[l-2],i[l-1]),n.push(f.NONE);for(let c=0;c<l;c+=2)e.push(i[c],i[c+1]),n.push(r);e.push(i[0],i[1]),n.push(f.NONE),e.push(i[2],i[3]),n.push(f.NONE)}fill(t,s){const{verts:e,joints:n}=s,{points:i,triangles:r}=t;if(r.length=0,!t.fillAA){e.push(i[0],i[1],i[2],i[3],i[4],i[5],i[6],i[7]),n.push(f.FILL,f.FILL,f.FILL,f.FILL),r.push(0,1,2,0,2,3);return}this._polyBuilder.fill(t,s)}}class ot{constructor(){this._circleBuilder=new W}path(t,s){this._circleBuilder.path(t,s)}line(t,s){this._circleBuilder.line(t,s)}fill(t,s){this._circleBuilder.fill(t,s)}}const X={[v.SHAPES.POLY]:new tt,[v.SHAPES.CIRC]:new W,[v.SHAPES.ELIP]:new W,[v.SHAPES.RECT]:new ht,[v.SHAPES.RREC]:new ot},et=[],j=[],U=new v.Point,yt=new $.Bounds;class it extends v.Geometry{constructor(){super(),this.indicesUint16=null,this.initAttributes(!1),this.buildData=new rt,this.graphicsData=[],this.dirty=0,this.batchDirty=-1,this.cacheDirty=-1,this.clearDirty=0,this.drawCalls=[],this.batches=[],this.shapeBuildIndex=0,this.shapeBatchIndex=0,this._bounds=new $.Bounds,this.boundsDirty=-1,this.boundsPadding=0,this.batchable=!1,this.indicesUint16=null,this.packer=null,this.packSize=0,this.pack32index=null}get points(){return this.buildData.verts}get closePointEps(){return this.buildData.closePointEps}initAttributes(t){this._buffer=new v.Buffer(null,t,!1),this._bufferFloats=new Float32Array,this._bufferUint=new Uint32Array,this._indexBuffer=new v.Buffer(null,t,!0),this.addAttribute("aPrev",this._buffer,2,!1,v.TYPES.FLOAT).addAttribute("aPoint1",this._buffer,2,!1,v.TYPES.FLOAT).addAttribute("aPoint2",this._buffer,2,!1,v.TYPES.FLOAT).addAttribute("aNext",this._buffer,2,!1,v.TYPES.FLOAT).addAttribute("aTravel",this._buffer,1,!1,v.TYPES.FLOAT).addAttribute("aVertexJoint",this._buffer,1,!1,v.TYPES.FLOAT).addAttribute("aStyleId",this._buffer,1,!1,v.TYPES.FLOAT).addAttribute("aColor",this._buffer,4,!0,v.TYPES.UNSIGNED_BYTE).addIndex(this._indexBuffer),this.strideFloats=12}checkInstancing(t,s){this.packer||(this.packer=new G,this.pack32index=s)}get bounds(){return this.boundsDirty!==this.dirty&&(this.boundsDirty=this.dirty,this.calculateBounds()),this._bounds}invalidate(){this.boundsDirty=-1,this.dirty++,this.batchDirty++,this.shapeBuildIndex=0,this.shapeBatchIndex=0,this.packSize=0,this.buildData.clear();for(let t=0;t<this.drawCalls.length;t++)this.drawCalls[t].clear(),j.push(this.drawCalls[t]);this.drawCalls.length=0;for(let t=0;t<this.batches.length;t++){const s=this.batches[t];s.reset(),et.push(s)}this.batches.length=0}clear(){return this.graphicsData.length>0&&(this.invalidate(),this.clearDirty++,this.graphicsData.length=0),this}drawShape(t,s=null,e=null,n=null){const i=new z(t,s,e,n);return this.graphicsData.push(i),this.dirty++,this}drawHole(t,s=null){if(!this.graphicsData.length)return null;const e=new z(t,null,null,s),n=this.graphicsData[this.graphicsData.length-1];return e.lineStyle=n.lineStyle,n.holes.push(e),this.dirty++,this}destroy(){super.destroy();for(let t=0;t<this.graphicsData.length;++t)this.graphicsData[t].destroy();this.buildData.destroy(),this.buildData=null,this.indexBuffer.destroy(),this.indexBuffer=null,this.graphicsData.length=0,this.graphicsData=null,this.drawCalls.length=0,this.drawCalls=null,this.batches.length=0,this.batches=null,this._bounds=null}containsPoint(t){const s=this.graphicsData;for(let e=0;e<s.length;++e){const n=s[e];if(n.fillStyle.visible&&n.shape&&(n.matrix?n.matrix.applyInverse(t,U):U.copyFrom(t),n.shape.contains(U.x,U.y))){let i=!1;if(n.holes){for(let r=0;r<n.holes.length;r++)if(n.holes[r].shape.contains(U.x,U.y)){i=!0;break}}if(!i)return!0}}return!1}updatePoints(){}updateBufferSize(){this._buffer.update(new Float32Array)}updateBuild(){const{graphicsData:t,buildData:s}=this,e=t.length;for(let n=this.shapeBuildIndex;n<e;n++){const i=t[n];i.strokeStart=0,i.strokeLen=0,i.fillStart=0,i.fillLen=0;const{fillStyle:r,lineStyle:l,holes:c}=i;if(!r.visible&&!l.visible)continue;const p=X[i.type];if(i.clearPath(),p.path(i,s),i.matrix&&this.transformPoints(i.points,i.matrix),i.clearBuild(),!(i.points.length<=2)&&((r.visible||l.visible)&&this.processHoles(c),r.visible&&(i.fillAA=i.fillStyle.smooth&&i.fillStyle.texture===v.Texture.WHITE&&c.length===0&&!(i.closeStroke&&i.lineStyle.visible&&!i.lineStyle.shader&&i.lineStyle.alpha>=.99&&i.lineStyle.width*Math.min(i.lineStyle.alignment,1-i.lineStyle.alignment)>=.495),i.fillStart=s.joints.length,c.length?X[v.SHAPES.POLY].fill(i,s):p.fill(i,s),i.fillLen=s.joints.length-i.fillStart),l.visible)){i.strokeStart=s.joints.length,p.line(i,s);for(let u=0;u<c.length;u++){const o=c[u];X[o.type].line(o,s)}i.strokeLen=s.joints.length-i.strokeStart}}this.shapeBuildIndex=e}updateBatches(t){if(!this.graphicsData.length){this.batchable=!0;return}if(this.updateBuild(),!this.validateBatching())return;const{buildData:s,graphicsData:e}=this,n=e.length;this.cacheDirty=this.dirty;let i=null,r=null;this.batches.length>0&&(i=this.batches[this.batches.length-1],r=i.style);for(let l=this.shapeBatchIndex;l<n;l++){const c=e[l],p=c.fillStyle,u=c.lineStyle;if(c.matrix&&this.transformPoints(c.points,c.matrix),!(!p.visible&&!u.visible))for(let o=0;o<2;o++){const h=o===0?p:u;if(!h.visible)continue;const d=h.texture.baseTexture,m=s.vertexSize,x=s.indexSize;d.wrapMode=v.WRAP_MODES.REPEAT,o===0?this.packer.updateBufferSize(c.fillStart,c.fillLen,c.triangles.length,s):this.packer.updateBufferSize(c.strokeStart,c.strokeLen,c.triangles.length,s),s.vertexSize!==m&&(i&&!this._compareStyles(r,h)&&(i.end(x,m),i=null),i||(i=et.pop()||new at,i.begin(h,x,m),this.batches.push(i),r=h),o===0?i.jointEnd=c.fillStart+c.fillLen:i.jointEnd=c.strokeStart+c.strokeLen)}}if(this.shapeBatchIndex=n,i&&i.end(s.indexSize,s.vertexSize),this.batches.length===0){this.batchable=!0;return}this.batchable=this.isBatchable(),this.batchable?this.packBatches():(this.buildDrawCalls(t),this.updatePack())}updatePack(){const{vertexSize:t,indexSize:s}=this.buildData;if(this.packSize===t)return;const{strideFloats:e,packer:n,buildData:i,batches:r}=this,l=this._buffer,c=this._indexBuffer,p=t*e;if(l.data.length!==p){const o=new ArrayBuffer(p*4);this._bufferFloats=new Float32Array(o),this._bufferUint=new Uint32Array(o),l.data=this._bufferFloats}c.data.length!==s&&(t>65535&&this.pack32index?c.data=new Uint32Array(s):c.data=new Uint16Array(s)),n.beginPack(i,this._bufferFloats,this._bufferUint,c.data);let u=0;for(let o=0;o<this.graphicsData.length;o++){const h=this.graphicsData[o];if(h.fillLen){for(;r[u].jointEnd<=h.fillStart;)u++;n.packInterleavedGeometry(h.fillStart,h.fillLen,h.triangles,r[u].styleId,r[u].rgba)}if(h.strokeLen){for(;r[u].jointEnd<=h.strokeStart;)u++;n.packInterleavedGeometry(h.strokeStart,h.strokeLen,h.triangles,r[u].styleId,r[u].rgba)}}l.update(),c.update(),this.packSize=t}_compareStyles(t,s){if(!t||!s||t.texture.baseTexture!==s.texture.baseTexture||t.color+t.alpha!==s.color+s.alpha||t.width!==s.width||t.scaleMode!==s.scaleMode||t.alignment!==s.alignment)return!1;const e=t.matrix||v.Matrix.IDENTITY,n=s.matrix||v.Matrix.IDENTITY;return K(e,n)}validateBatching(){if(this.dirty===this.cacheDirty||!this.graphicsData.length)return!1;for(let t=0,s=this.graphicsData.length;t<s;t++){const e=this.graphicsData[t],n=e.fillStyle,i=e.lineStyle;if(n&&!n.texture.baseTexture.valid||i&&!i.texture.baseTexture.valid)return!1}return!0}packBatches(){this.batchDirty++;const t=this.batches;for(let s=0,e=t.length;s<e;s++){const n=t[s];for(let i=0;i<n.size;i++){const r=n.start+i;this.indicesUint16[r]=this.indicesUint16[r]-n.attribStart}}}isBatchable(){return!1}buildDrawCalls(t){for(let n=0;n<this.drawCalls.length;n++)this.drawCalls[n].clear(),j.push(this.drawCalls[n]);this.drawCalls.length=0;let s=j.pop()||new Z;s.begin(t,null);let e=0;this.drawCalls.push(s);for(let n=0;n<this.batches.length;n++){const i=this.batches[n],r=i.style;if(i.attribSize===0)continue;let l=-1;const c=r.getTextureMatrix();s.check(r.shader)&&(l=s.add(r.texture,c,r.width,r.alignment||0,r.packLineScale())),l<0&&(s=j.pop()||new Z,this.drawCalls.push(s),s.begin(t,r.shader),s.start=e,l=s.add(r.texture,c,r.width,r.alignment||0,r.packLineScale())),s.size+=i.size,e+=i.size;const{color:p,alpha:u}=r,o=(p>>16)+(p&65280)+((p&255)<<16);i.rgba=v.utils.premultiplyTint(o,u),i.styleId=l}}processHoles(t){for(let s=0;s<t.length;s++){const e=t[s],n=X[e.type];e.clearPath(),n.path(e,this.buildData),e.matrix&&this.transformPoints(e.points,e.matrix)}}calculateBounds(){const t=this._bounds,s=yt;let e=v.Matrix.IDENTITY;this._bounds.clear(),s.clear();for(let n=0;n<this.graphicsData.length;n++){const i=this.graphicsData[n],r=i.shape,l=i.type,c=i.lineStyle,p=i.matrix||v.Matrix.IDENTITY;let u=0;if(c&&c.visible&&(u=c.width,l!==v.SHAPES.POLY||i.fillStyle.visible?u*=Math.max(0,c.alignment):u*=Math.max(c.alignment,1-c.alignment)),e!==p&&(s.isEmpty()||(t.addBoundsMatrix(s,e),s.clear()),e=p),l===v.SHAPES.RECT||l===v.SHAPES.RREC){const o=r;s.addFramePad(o.x,o.y,o.x+o.width,o.y+o.height,u,u)}else if(l===v.SHAPES.CIRC){const o=r;s.addFramePad(o.x,o.y,o.x,o.y,o.radius+u,o.radius+u)}else if(l===v.SHAPES.ELIP){const o=r;s.addFramePad(o.x,o.y,o.x,o.y,o.width+u,o.height+u)}else{const o=r;t.addVerticesMatrix(e,o.points,0,o.points.length,u,u)}}s.isEmpty()||t.addBoundsMatrix(s,e),t.pad(this.boundsPadding,this.boundsPadding)}transformPoints(t,s){for(let e=0;e<t.length/2;e++){const n=t[e*2],i=t[e*2+1];t[e*2]=s.a*n+s.c*i+s.tx,t[e*2+1]=s.b*n+s.d*i+s.ty}}}it.BATCHABLE_SIZE=100;const ct=`#version 100
precision highp float;
const float FILL = 1.0;
const float BEVEL = 4.0;
const float MITER = 8.0;
const float ROUND = 12.0;
const float JOINT_CAP_BUTT = 16.0;
const float JOINT_CAP_SQUARE = 18.0;
const float JOINT_CAP_ROUND = 20.0;

const float FILL_EXPAND = 24.0;

const float CAP_BUTT = 1.0;
const float CAP_SQUARE = 2.0;
const float CAP_ROUND = 3.0;
const float CAP_BUTT2 = 4.0;

const float MITER_LIMIT = 10.0;

// === geom ===
attribute vec2 aPrev;
attribute vec2 aPoint1;
attribute vec2 aPoint2;
attribute vec2 aNext;
attribute float aVertexJoint;
attribute float aTravel;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;

varying vec4 vLine1;
varying vec4 vLine2;
varying vec4 vArc;
varying float vType;

uniform float resolution;
uniform float expand;

// === style ===
attribute float aStyleId;
attribute vec4 aColor;

varying float vTextureId;
varying vec4 vColor;
varying vec2 vTextureCoord;
varying vec2 vTravel;

uniform vec2 styleLine[%MAX_STYLES%];
uniform vec3 styleMatrix[2 * %MAX_STYLES%];
uniform float styleTextureId[%MAX_STYLES%];
uniform vec2 samplerSize[%MAX_TEXTURES%];

vec2 doBisect(vec2 norm, float len, vec2 norm2, float len2,
    float dy, float inner) {
    vec2 bisect = (norm + norm2) / 2.0;
    bisect /= dot(norm, bisect);
    vec2 shift = dy * bisect;
    if (inner > 0.5) {
        if (len < len2) {
            if (abs(dy * (bisect.x * norm.y - bisect.y * norm.x)) > len) {
                return dy * norm;
            }
        } else {
            if (abs(dy * (bisect.x * norm2.y - bisect.y * norm2.x)) > len2) {
                return dy * norm;
            }
        }
    }
    return dy * bisect;
}

void main(void){
    vec2 pointA = (translationMatrix * vec3(aPoint1, 1.0)).xy;
    vec2 pointB = (translationMatrix * vec3(aPoint2, 1.0)).xy;

    vec2 xBasis = pointB - pointA;
    float len = length(xBasis);
    vec2 forward = xBasis / len;
    vec2 norm = vec2(forward.y, -forward.x);

    float type = floor(aVertexJoint / 16.0);
    float vertexNum = aVertexJoint - type * 16.0;
    float dx = 0.0, dy = 1.0;

    float capType = floor(type / 32.0);
    type -= capType * 32.0;

    int styleId = int(aStyleId + 0.5);
    float lineWidth = styleLine[styleId].x;
    vTextureId = floor(styleTextureId[styleId] / 4.0);
    float scaleMode = styleTextureId[styleId] - vTextureId * 4.0;
    float avgScale = 1.0;
    if (scaleMode > 2.5) {
        avgScale = length(translationMatrix * vec3(1.0, 0.0, 0.0));
    } else if (scaleMode > 1.5) {
        avgScale = length(translationMatrix * vec3(0.0, 1.0, 0.0));
    } else if (scaleMode > 0.5) {
        vec2 avgDiag = (translationMatrix * vec3(1.0, 1.0, 0.0)).xy;
        avgScale = sqrt(dot(avgDiag, avgDiag) * 0.5);
    }
    lineWidth *= 0.5 * avgScale;
    float lineAlignment = 2.0 * styleLine[styleId].y - 1.0;
    vTextureCoord = vec2(0.0);

    vec2 pos;

    if (capType == CAP_ROUND) {
        vertexNum += 4.0;
        type = JOINT_CAP_ROUND;
        capType = 0.0;
        lineAlignment = -lineAlignment;
    }

    vLine1 = vec4(0.0, 10.0, 1.0, 0.0);
    vLine2 = vec4(0.0, 10.0, 1.0, 0.0);
    vArc = vec4(0.0);
    if (type == FILL) {
        pos = pointA;
        vType = 0.0;
        vLine2 = vec4(-2.0, -2.0, -2.0, 0.0);
        vec2 vTexturePixel;
        vTexturePixel.x = dot(vec3(aPoint1, 1.0), styleMatrix[styleId * 2]);
        vTexturePixel.y = dot(vec3(aPoint1, 1.0), styleMatrix[styleId * 2 + 1]);
        vTextureCoord = vTexturePixel / samplerSize[int(vTextureId)];
    } else if (type >= FILL_EXPAND && type < FILL_EXPAND + 7.5) {
        // expand vertices
        float flags = type - FILL_EXPAND;
        float flag3 = floor(flags / 4.0);
        float flag2 = floor((flags - flag3 * 4.0) / 2.0);
        float flag1 = flags - flag3 * 4.0 - flag2 * 2.0;

        vec2 prev = (translationMatrix * vec3(aPrev, 1.0)).xy;

        if (vertexNum < 0.5) {
            pos = prev;
        } else if (vertexNum < 1.5) {
            pos = pointA;
        } else {
            pos = pointB;
        }
        float len2 = length(aNext);
        vec2 bisect = (translationMatrix * vec3(aNext, 0.0)).xy;
        if (len2 > 0.01) {
            bisect = normalize(bisect) * len2;
        }

        vec2 n1 = normalize(vec2(pointA.y - prev.y, -(pointA.x - prev.x)));
        vec2 n2 = normalize(vec2(pointB.y - pointA.y, -(pointB.x - pointA.x)));
        vec2 n3 = normalize(vec2(prev.y - pointB.y, -(prev.x - pointB.x)));

        if (n1.x * n2.y - n1.y * n2.x < 0.0) {
            n1 = -n1;
            n2 = -n2;
            n3 = -n3;
        }
        pos += bisect * expand;

        vLine1 = vec4(16.0, 16.0, 16.0, -1.0);
        if (flag1 > 0.5) {
            vLine1.x = -dot(pos - prev, n1);
        }
        if (flag2 > 0.5) {
            vLine1.y = -dot(pos - pointA, n2);
        }
        if (flag3 > 0.5) {
            vLine1.z = -dot(pos - pointB, n3);
        }
        vLine1.xyz *= resolution;
        vType = 2.0;
    } else if (type >= BEVEL) {
        float dy = lineWidth + expand;
        float shift = lineWidth * lineAlignment;
        float inner = 0.0;
        if (vertexNum >= 1.5) {
            dy = -dy;
            inner = 1.0;
        }

        vec2 base, next, xBasis2, bisect;
        float flag = 0.0;
        float side2 = 1.0;
        if (vertexNum < 0.5 || vertexNum > 2.5 && vertexNum < 3.5) {
            next = (translationMatrix * vec3(aPrev, 1.0)).xy;
            base = pointA;
            flag = type - floor(type / 2.0) * 2.0;
            side2 = -1.0;
        } else {
            next = (translationMatrix * vec3(aNext, 1.0)).xy;
            base = pointB;
            if (type >= MITER && type < MITER + 3.5) {
                flag = step(MITER + 1.5, type);
                // check miter limit here?
            }
        }
        xBasis2 = next - base;
        float len2 = length(xBasis2);
        vec2 norm2 = vec2(xBasis2.y, -xBasis2.x) / len2;
        float D = norm.x * norm2.y - norm.y * norm2.x;
        if (D < 0.0) {
            inner = 1.0 - inner;
        }

        norm2 *= side2;

        float collinear = step(0.0, dot(norm, norm2));

        vType = 0.0;
        float dy2 = -1000.0;

        if (abs(D) < 0.01 && collinear < 0.5) {
            if (type >= ROUND && type < ROUND + 1.5) {
                type = JOINT_CAP_ROUND;
            }
            //TODO: BUTT here too
        }

        vLine1 = vec4(0.0, lineWidth, max(abs(norm.x), abs(norm.y)), min(abs(norm.x), abs(norm.y)));
        vLine2 = vec4(0.0, lineWidth, max(abs(norm2.x), abs(norm2.y)), min(abs(norm2.x), abs(norm2.y)));

        if (vertexNum < 3.5) {
            if (abs(D) < 0.01 && collinear < 0.5) {
                pos = (shift + dy) * norm;
            } else {
                if (flag < 0.5 && inner < 0.5) {
                    pos = (shift + dy) * norm;
                } else {
                    pos = doBisect(norm, len, norm2, len2, shift + dy, inner);
                }
            }
            vLine2.y = -1000.0;
            if (capType >= CAP_BUTT && capType < CAP_ROUND) {
                float extra = step(CAP_SQUARE, capType) * lineWidth;
                vec2 back = -forward;
                if (vertexNum < 0.5 || vertexNum > 2.5) {
                    pos += back * (expand + extra);
                    dy2 = expand;
                } else {
                    dy2 = dot(pos + base - pointA, back) - extra;
                }
            }
            if (type >= JOINT_CAP_BUTT && type < JOINT_CAP_SQUARE + 0.5) {
                float extra = step(JOINT_CAP_SQUARE, type) * lineWidth;
                if (vertexNum < 0.5 || vertexNum > 2.5) {
                    vLine2.y = dot(pos + base - pointB, forward) - extra;
                } else {
                    pos += forward * (expand + extra);
                    vLine2.y = expand;
                    if (capType >= CAP_BUTT) {
                        dy2 -= expand + extra;
                    }
                }
            }
        } else if (type >= JOINT_CAP_ROUND && type < JOINT_CAP_ROUND + 1.5) {
            base += shift * norm;
            if (inner > 0.5) {
                dy = -dy;
                inner = 0.0;
            }
            vec2 d2 = abs(dy) * forward;
            if (vertexNum < 4.5) {
                dy = -dy;
                pos = dy * norm;
            } else if (vertexNum < 5.5) {
                pos = dy * norm;
            } else if (vertexNum < 6.5) {
                pos = dy * norm + d2;
                vArc.x = abs(dy);
            } else {
                dy = -dy;
                pos = dy * norm + d2;
                vArc.x = abs(dy);
            }
            vLine2 = vec4(0.0, lineWidth * 2.0 + 10.0, 1.0  , 0.0); // forget about line2 with type=3
            vArc.y = dy;
            vArc.z = 0.0;
            vArc.w = lineWidth;
            vType = 3.0;
        } else if (abs(D) < 0.01 && collinear < 0.5) {
            pos = dy * norm;
        } else {
            if (inner > 0.5) {
                dy = -dy;
                inner = 0.0;
            }
            float side = sign(dy);
            vec2 norm3 = normalize(norm + norm2);

            if (type >= MITER && type < MITER + 3.5) {
                vec2 farVertex = doBisect(norm, len, norm2, len2, shift + dy, 0.0);
                if (length(farVertex) > abs(shift + dy) * MITER_LIMIT) {
                    type = BEVEL;
                }
            }

            if (vertexNum < 4.5) {
                pos = doBisect(norm, len, norm2, len2, shift - dy, 1.0);
            } else if (vertexNum < 5.5) {
                pos = (shift + dy) * norm;
            } else if (vertexNum > 7.5) {
                pos = (shift + dy) * norm2;
            } else {
                if (type >= ROUND && type < ROUND + 1.5) {
                    pos = doBisect(norm, len, norm2, len2, shift + dy, 0.0);
                    float d2 = abs(shift + dy);
                    if (length(pos) > abs(shift + dy) * 1.5) {
                        if (vertexNum < 6.5) {
                            pos.x = (shift + dy) * norm.x - d2 * norm.y;
                            pos.y = (shift + dy) * norm.y + d2 * norm.x;
                        } else {
                            pos.x = (shift + dy) * norm2.x + d2 * norm2.y;
                            pos.y = (shift + dy) * norm2.y - d2 * norm2.x;
                        }
                    }
                } else if (type >= MITER && type < MITER + 3.5) {
                    pos = doBisect(norm, len, norm2, len2, shift + dy, 0.0); //farVertex
                } else if (type >= BEVEL && type < BEVEL + 1.5) {
                    float d2 = side / resolution;
                    if (vertexNum < 6.5) {
                        pos = (shift + dy) * norm + d2 * norm3;
                    } else {
                        pos = (shift + dy) * norm2 + d2 * norm3;
                    }
                }
            }

            if (type >= ROUND && type < ROUND + 1.5) {
                vArc.x = side * dot(pos, norm3);
                vArc.y = pos.x * norm3.y - pos.y * norm3.x;
                vArc.z = dot(norm, norm3) * (lineWidth + side * shift);
                vArc.w = lineWidth + side * shift;
                vType = 3.0;
            } else if (type >= MITER && type < MITER + 3.5) {
                vType = 1.0;
            } else if (type >= BEVEL && type < BEVEL + 1.5) {
                vType = 4.0;
                vArc.z = dot(norm, norm3) * (lineWidth + side * shift) - side * dot(pos, norm3);
            }

            dy = side * (dot(pos, norm) - shift);
            dy2 = side * (dot(pos, norm2) - shift);
        }

        pos += base;
        vLine1.xy = vec2(dy, vLine1.y) * resolution;
        vLine2.xy = vec2(dy2, vLine2.y) * resolution;
        vArc = vArc * resolution;
        vTravel = vec2(aTravel * avgScale + dot(pos - pointA, vec2(-norm.y, norm.x)), avgScale);
    }

    gl_Position = vec4((projectionMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);

    vColor = aColor * tint;
}`,xt=`#version 100
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif
`,ut=`%PRECISION%
varying vec4 vColor;
varying vec4 vLine1;
varying vec4 vLine2;
varying vec4 vArc;
varying float vType;
varying float vTextureId;
varying vec2 vTextureCoord;
varying vec2 vTravel;
uniform sampler2D uSamplers[%MAX_TEXTURES%];

%PIXEL_LINE%

void main(void){
    %PIXEL_COVERAGE%

    vec4 texColor;
    float textureId = floor(vTextureId+0.5);
    %FOR_LOOP%

    gl_FragColor = vColor * texColor * alpha;
}
`,vt=[`
float pixelLine(float x, float A, float B) {
    return clamp(x + 0.5, 0.0, 1.0);
}
`,`
float pixelLine(float x, float A, float B) {
    float y = abs(x), s = sign(x);
    if (y * 2.0 < A - B) {
        return 0.5 + s * y / A;
    }
    y -= (A - B) * 0.5;
    y = max(1.0 - y / B, 0.0);
    return (1.0 + s * (1.0 - y * y)) * 0.5;
    //return clamp(x + 0.5, 0.0, 1.0);
}
`],mt=`float alpha = 1.0;
if (vType < 0.5) {
    float left = pixelLine(-vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float right = pixelLine(vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float near = vLine2.x - 0.5;
    float far = min(vLine2.x + 0.5, 0.0);
    float top = vLine2.y - 0.5;
    float bottom = min(vLine2.y + 0.5, 0.0);
    alpha = (right - left) * max(bottom - top, 0.0) * max(far - near, 0.0);
} else if (vType < 1.5) {
    float a1 = pixelLine(- vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float a2 = pixelLine(vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float b1 = pixelLine(- vLine2.y - vLine2.x, vLine2.z, vLine2.w);
    float b2 = pixelLine(vLine2.y - vLine2.x, vLine2.z, vLine2.w);
    alpha = a2 * b2 - a1 * b1;
} else if (vType < 2.5) {
    alpha *= max(min(vLine1.x + 0.5, 1.0), 0.0);
    alpha *= max(min(vLine1.y + 0.5, 1.0), 0.0);
    alpha *= max(min(vLine1.z + 0.5, 1.0), 0.0);
} else if (vType < 3.5) {
    float a1 = pixelLine(- vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float a2 = pixelLine(vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float b1 = pixelLine(- vLine2.y - vLine2.x, vLine2.z, vLine2.w);
    float b2 = pixelLine(vLine2.y - vLine2.x, vLine2.z, vLine2.w);
    float alpha_miter = a2 * b2 - a1 * b1;
    float alpha_plane = clamp(vArc.z - vArc.x + 0.5, 0.0, 1.0);
    float d = length(vArc.xy);
    float circle_hor = max(min(vArc.w, d + 0.5) - max(-vArc.w, d - 0.5), 0.0);
    float circle_vert = min(vArc.w * 2.0, 1.0);
    float alpha_circle = circle_hor * circle_vert;
    alpha = min(alpha_miter, max(alpha_circle, alpha_plane));
} else {
    float a1 = pixelLine(- vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float a2 = pixelLine(vLine1.y - vLine1.x, vLine1.z, vLine1.w);
    float b1 = pixelLine(- vLine2.y - vLine2.x, vLine2.z, vLine2.w);
    float b2 = pixelLine(vLine2.y - vLine2.x, vLine2.z, vLine2.w);
    alpha = a2 * b2 - a1 * b1;
    alpha *= clamp(vArc.z + 0.5, 0.0, 1.0);
}
`;class F extends v.Shader{constructor(t,s=ct,e=ut,n={}){s=F.generateVertexSrc(t,s),e=F.generateFragmentSrc(t,e);const{maxStyles:i,maxTextures:r}=t,l=new Int32Array(r);for(let c=0;c<r;c++)l[c]=c;super(v.Program.from(s,e),Object.assign(n,{styleMatrix:new Float32Array(6*i),styleTextureId:new Float32Array(i),styleLine:new Float32Array(2*i),samplerSize:new Float32Array(2*r),uSamplers:l,tint:new Float32Array([1,1,1,1]),resolution:1,expand:1})),this.settings=t}static generateVertexSrc(t,s=ct){const{maxStyles:e,maxTextures:n}=t;return s=s.replace(/%MAX_TEXTURES%/gi,`${n}`).replace(/%MAX_STYLES%/gi,`${e}`),s}static generateFragmentSrc(t,s=ut){const{maxTextures:e,pixelLine:n}=t;return s=s.replace(/%PRECISION%/gi,xt).replace(/%PIXEL_LINE%/gi,vt[n]).replace(/%PIXEL_COVERAGE%/gi,mt).replace(/%MAX_TEXTURES%/gi,`${e}`).replace(/%FOR_LOOP%/gi,this.generateSampleSrc(e)),s}static generateSampleSrc(t){let s="";s+=`
`,s+=`
`;for(let e=0;e<t;e++)e>0&&(s+=`
else `),e<t-1&&(s+=`if(textureId < ${e}.5)`),s+=`
{`,s+=`
	texColor = texture2D(uSamplers[${e}], vTextureCoord);`,s+=`
}`;return s+=`
`,s+=`
`,s}}const k={LINE_SCALE_MODE:C.NORMAL,SHADER_MAX_STYLES:24,SHADER_MAX_TEXTURES:4,PIXEL_LINE:0},gt=O.Graphics,{BezierUtils:bt,QuadraticUtils:Tt,ArcUtils:dt}=O.graphicsUtils,_t=new Float32Array(3),st={},Q=class extends $.Container{constructor(a=null){super(),this._geometry=a||new it,this._geometry.refCount++,this.shader=null,this.shaderSettings={maxStyles:k.SHADER_MAX_STYLES,maxTextures:k.SHADER_MAX_TEXTURES,pixelLine:k.PIXEL_LINE},this.state=v.State.for2d(),this._fillStyle=new J,this._lineStyle=new Y,this._matrix=null,this._holeMode=!1,this.currentPath=null,this.batches=[],this.batchTint=-1,this.batchDirty=-1,this.vertexData=null,this.pluginName="smooth",this._transformID=-1,this.tint=16777215,this.blendMode=v.BLEND_MODES.NORMAL}get geometry(){return this._geometry}clone(){return this.finishPoly(),new Q(this._geometry)}set blendMode(a){this.state.blendMode=a}get blendMode(){return this.state.blendMode}get tint(){return this._tint}set tint(a){this._tint=a}get fill(){return this._fillStyle}get line(){return this._lineStyle}lineStyle(a=null,t=0,s=1,e=.5,n=k.LINE_SCALE_MODE){if(typeof a=="number")typeof n=="boolean"&&(n=n?C.NONE:C.NORMAL),a={width:a,color:t,alpha:s,alignment:e,scaleMode:n};else{const i=a.native;i!==void 0&&(a.scaleMode=i?C.NONE:C.NORMAL)}return this.lineTextureStyle(a)}lineTextureStyle(a){a=Object.assign({width:0,texture:v.Texture.WHITE,color:a&&a.texture?16777215:0,alpha:1,matrix:null,alignment:.5,native:!1,cap:O.LINE_CAP.BUTT,join:O.LINE_JOIN.MITER,miterLimit:10,shader:null,scaleMode:k.LINE_SCALE_MODE},a),this.currentPath&&this.startPoly();const t=a.width>0&&a.alpha>0;return t?(a.matrix&&(a.matrix=a.matrix.clone(),a.matrix.invert()),Object.assign(this._lineStyle,{visible:t},a)):this._lineStyle.reset(),this}startPoly(){if(this.currentPath){const a=this.currentPath.points,t=this.currentPath.points.length;t>2&&(this.drawShape(this.currentPath),this.currentPath=new v.Polygon,this.currentPath.closeStroke=!1,this.currentPath.points.push(a[t-2],a[t-1]))}else this.currentPath=new v.Polygon,this.currentPath.closeStroke=!1}finishPoly(){this.currentPath&&(this.currentPath.points.length>2?(this.drawShape(this.currentPath),this.currentPath=null):this.currentPath.points.length=0)}moveTo(a,t){return this.startPoly(),this.currentPath.points[0]=a,this.currentPath.points[1]=t,this}lineTo(a,t){this.currentPath||this.moveTo(0,0);const s=this.currentPath.points,e=s[s.length-2],n=s[s.length-1];return(e!==a||n!==t)&&s.push(a,t),this}_initCurve(a=0,t=0){this.currentPath?this.currentPath.points.length===0&&(this.currentPath.points=[a,t]):this.moveTo(a,t)}quadraticCurveTo(a,t,s,e){this._initCurve();const n=this.currentPath.points;return n.length===0&&this.moveTo(0,0),Tt.curveTo(a,t,s,e,n),this}bezierCurveTo(a,t,s,e,n,i){return this._initCurve(),bt.curveTo(a,t,s,e,n,i,this.currentPath.points),this}arcTo(a,t,s,e,n){this._initCurve(a,t);const i=this.currentPath.points,r=dt.curveTo(a,t,s,e,n,i);if(r){const{cx:l,cy:c,radius:p,startAngle:u,endAngle:o,anticlockwise:h}=r;this.arc(l,c,p,u,o,h)}return this}arc(a,t,s,e,n,i=!1){if(e===n)return this;if(!i&&n<=e?n+=v.PI_2:i&&e<=n&&(e+=v.PI_2),n-e===0)return this;const r=a+Math.cos(e)*s,l=t+Math.sin(e)*s,c=this._geometry.closePointEps;let p=this.currentPath?this.currentPath.points:null;if(p){const u=Math.abs(p[p.length-2]-r),o=Math.abs(p[p.length-1]-l);u<c&&o<c||p.push(r,l)}else this.moveTo(r,l),p=this.currentPath.points;return dt.arc(r,l,a,t,s,e,n,i,p),this}beginFill(a=0,t=1,s=!1){return this.beginTextureFill({texture:v.Texture.WHITE,color:a,alpha:t,smooth:s})}beginTextureFill(a){a=Object.assign({texture:v.Texture.WHITE,color:16777215,alpha:1,matrix:null,smooth:!1},a),this.currentPath&&this.startPoly();const t=a.alpha>0;return t?(a.matrix&&(a.matrix=a.matrix.clone(),a.matrix.invert()),Object.assign(this._fillStyle,{visible:t},a)):this._fillStyle.reset(),this}endFill(){return this.finishPoly(),this._fillStyle.reset(),this}drawRect(a,t,s,e){return this.drawShape(new v.Rectangle(a,t,s,e))}drawRoundedRect(a,t,s,e,n){return this.drawShape(new v.RoundedRectangle(a,t,s,e,n))}drawCircle(a,t,s){return this.drawShape(new v.Circle(a,t,s))}drawEllipse(a,t,s,e){return this.drawShape(new v.Ellipse(a,t,s,e))}drawPolygon(...a){let t,s=!0;const e=a[0];e.points?(s=e.closeStroke,t=e.points):Array.isArray(a[0])?t=a[0]:t=a;const n=new v.Polygon(t);return n.closeStroke=s,this.drawShape(n),this}drawShape(a){return this._holeMode?this._geometry.drawHole(a,this._matrix):this._geometry.drawShape(a,this._fillStyle.clone(),this._lineStyle.clone(),this._matrix),this}clear(){return this._geometry.clear(),this._lineStyle.reset(),this._fillStyle.reset(),this._boundsID++,this._matrix=null,this._holeMode=!1,this.currentPath=null,this}isFastRect(){const a=this._geometry.graphicsData;return a.length===1&&a[0].shape.type===v.SHAPES.RECT&&!a[0].matrix&&!a[0].holes.length&&!(a[0].lineStyle.visible&&a[0].lineStyle.width)}_renderCanvas(a){gt.prototype._renderCanvas.call(this,a)}_render(a){this.finishPoly();const t=this._geometry,s=a.context.supports.uint32Indices;t.checkInstancing(a.geometry.hasInstance,s),t.updateBatches(this.shaderSettings),t.batchable?(this.batchDirty!==t.batchDirty&&this._populateBatches(),this._renderBatched(a)):(a.batch.flush(),this._renderDirect(a))}_populateBatches(){const a=this._geometry,t=this.blendMode,s=a.batches.length;this.batchTint=-1,this._transformID=-1,this.batchDirty=a.batchDirty,this.batches.length=s,this.vertexData=new Float32Array(a.points);for(let e=0;e<s;e++){const n=a.batches[e],i=n.style.color,r={vertexData:new Float32Array(this.vertexData.buffer,n.attribStart*4*2,n.attribSize*2),blendMode:t,_batchRGB:v.utils.hex2rgb(i),_tintRGB:i,_texture:n.style.texture,alpha:n.style.alpha,worldAlpha:1};this.batches[e]=r}}_renderBatched(a){if(this.batches.length){a.batch.setObjectRenderer(a.plugins[this.pluginName]),this.calculateVertices(),this.calculateTints();for(let t=0,s=this.batches.length;t<s;t++){const e=this.batches[t];e.worldAlpha=this.worldAlpha*e.alpha,a.plugins[this.pluginName].render(e)}}}_renderDirect(a){const t=this._resolveDirectShader(a);let s=t;const e=this._geometry,n=this.tint,i=this.worldAlpha,r=s.uniforms,l=e.drawCalls;r.translationMatrix=this.transform.worldTransform,r.tint[0]=(n>>16&255)/255*i,r.tint[1]=(n>>8&255)/255*i,r.tint[2]=(n&255)/255*i,r.tint[3]=i,r.resolution=a.renderTexture.current?a.renderTexture.current.resolution:a.resolution;const c=a.projection.transform;if(c){const u=Math.sqrt(c.a*c.a+c.b*c.b);r.resolution*=u}const p=a.renderTexture.current?a.renderTexture.current.multisample:a.multisample;r.expand=(p!==v.MSAA_QUALITY.NONE?2:1)/r.resolution,a.shader.bind(s),a.geometry.bind(e,s),a.state.set(this.state),s=null;for(let u=0,o=l.length;u<o;u++){const h=e.drawCalls[u],d=s!==h.shader;d&&(s=h.shader,s&&(s.uniforms.translationMatrix=this.transform.worldTransform,s.uniforms.tint&&(s.uniforms.tint[0]=r.tint[0],s.uniforms.tint[1]=r.tint[1],s.uniforms.tint[2]=r.tint[2],s.uniforms.tint[3]=r.tint[3])));const{texArray:m,styleArray:x,size:y,start:g}=h,L=m.count,E=s||t,P=E.uniforms.styleTextureId,S=E.uniforms.styleMatrix,b=E.uniforms.styleLine;for(let T=0;T<x.count;T++){P[T]=x.textureIds[T],b[T*2]=x.lines[T*2],b[T*2+1]=x.lines[T*2+1];const _=x.matrices[T];S[T*6]=_.a,S[T*6+1]=_.c,S[T*6+2]=_.tx,S[T*6+3]=_.b,S[T*6+4]=_.d,S[T*6+5]=_.ty}const N=E.uniforms.samplerSize;for(let T=0;T<L;T++)N[T*2]=m.elements[T].width,N[T*2+1]=m.elements[T].height;a.shader.bind(E),d&&a.geometry.bind(e);for(let T=0;T<L;T++)a.texture.bind(m.elements[T],T);a.geometry.draw(v.DRAW_MODES.TRIANGLES,y,g)}}_resolveDirectShader(a){let t=this.shader;const s=this.pluginName;return t||(st[s]||(st[s]=new F(this.shaderSettings)),t=st[s]),t}_calculateBounds(){this.finishPoly();const a=this._geometry;if(!a.graphicsData.length)return;const{minX:t,minY:s,maxX:e,maxY:n}=a.bounds;this._bounds.addFrame(this.transform,t,s,e,n)}containsPoint(a){return this.worldTransform.applyInverse(a,Q._TEMP_POINT),this._geometry.containsPoint(Q._TEMP_POINT)}calculateTints(){if(this.batchTint!==this.tint){this.batchTint=this.tint;const a=v.utils.hex2rgb(this.tint,_t);for(let t=0;t<this.batches.length;t++){const s=this.batches[t],e=s._batchRGB,n=a[0]*e[0]*255,i=a[1]*e[1]*255,r=a[2]*e[2]*255,l=(n<<16)+(i<<8)+(r|0);s._tintRGB=(l>>16)+(l&65280)+((l&255)<<16)}}}calculateVertices(){const a=this.transform._worldID;if(this._transformID===a)return;this._transformID=a;const t=this.transform.worldTransform,s=t.a,e=t.b,n=t.c,i=t.d,r=t.tx,l=t.ty,c=this._geometry.points,p=this.vertexData;let u=0;for(let o=0;o<c.length;o+=2){const h=c[o],d=c[o+1];p[u++]=s*h+n*d+r,p[u++]=i*d+e*h+l}}closePath(){const a=this.currentPath;return a&&(a.closeStroke=!0),this}setMatrix(a){return this._matrix=a,this}beginHole(){return this.finishPoly(),this._holeMode=!0,this}endHole(){return this.finishPoly(),this._holeMode=!1,this}destroy(a){this._geometry.refCount--,this._geometry.refCount===0&&this._geometry.dispose(),this._matrix=null,this.currentPath=null,this._lineStyle.destroy(),this._lineStyle=null,this._fillStyle.destroy(),this._fillStyle=null,this._geometry=null,this.shader=null,this.vertexData=null,this.batches.length=0,this.batches=null,super.destroy(a)}};let ft=Q;ft._TEMP_POINT=new v.Point;const Lt=`%PRECISION%
varying vec4 vColor;
varying vec4 vLine1;
varying vec4 vLine2;
varying vec4 vArc;
varying float vType;
varying float vTextureId;
varying vec2 vTextureCoord;
varying vec2 vTravel;
uniform sampler2D uSamplers[%MAX_TEXTURES%];
uniform float dash;
uniform float gap;

%PIXEL_LINE%

void main(void){
    %PIXEL_COVERAGE%

    float d = dash * vTravel.y;
    if (d > 0.0) {
        float g = gap * vTravel.y;
        if (g > 0.0) {
            float t = mod(vTravel.x, d + g);
            alpha *= mix(
                min(0.5 * d + 0.5 - abs(t - 0.5 * d), 1.0),
                max(abs(t - 0.5 * g - d) - 0.5 * g + 0.5, 0.0),
                step(d, t)
            );
        }
    } else {
        alpha = 0.0;
    }

    vec4 texColor;
    float textureId = floor(vTextureId+0.5);
    %FOR_LOOP%

    gl_FragColor = vColor * texColor * alpha;
}
`;class Et extends F{constructor(t){const s={maxStyles:16,maxTextures:1,pixelLine:1};super(s,void 0,Lt,t||{dash:8,gap:5})}}return I.BATCH_POOL=et,I.BatchDrawCall=Z,I.BatchPart=at,I.BatchStyleArray=nt,I.BuildData=rt,I.CircleBuilder=W,I.DRAW_CALL_POOL=j,I.DashLineShader=Et,I.FILL_COMMANDS=X,I.FillStyle=J,I.JOINT_TYPE=f,I.LINE_SCALE_MODE=C,I.LineStyle=Y,I.PolyBuilder=tt,I.RectangleBuilder=ht,I.RoundedRectangleBuilder=ot,I.SegmentPacker=G,I.SmoothGraphics=ft,I.SmoothGraphicsData=z,I.SmoothGraphicsGeometry=it,I.SmoothGraphicsShader=F,I.matrixEquals=K,I.settings=k,I}({},PIXI,PIXI,PIXI);
//# sourceMappingURL=pixi-graphics-smooth.js.map
