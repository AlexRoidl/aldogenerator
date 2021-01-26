#ifdef GL_ES
precision mediump float;
#endif
#define TWO_PI 6.28318530718

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform float rand;
uniform sampler2D tex;
uniform vec2 direction;
uniform float uIteration;
uniform vec3 colors[5];
uniform vec3 bgColor;
uniform vec2 point1;
uniform vec2 point2;
uniform float vol;
uniform float vollAdder;
uniform float treble;
uniform float bass;
uniform float strokeThickness;
uniform float strokeSpeed;
uniform float strokeBlur;
uniform float strokeFade;
uniform float strokeRotation;

varying vec2 vTexCoord;


float random (vec2 st) {
		return fract(sin(dot(st.xy,
												 vec2(12.9898,78.233)))*
				43758.5453123);
}


vec3 hsb2rgb( in vec3 c ){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                             6.0)-3.0)-1.0,
                     0.0,
                     1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix( vec3(1.0), rgb, c.y);
}


vec3 custCol(in float c){
		float flattening = 0.05;
		c = smoothstep(0.0,1.0,clamp(abs(mod(c++,2.0)-1.0)*(1.0+2.*flattening)-flattening,0.0,1.0));
		float h0 = 0.5;
		float h1 = 0.25;
		float h2 = 0.75;
		vec3 white = vec3(1.0,1.0,1.0);
		float fade = 1.0; //clamp(vollAdder/2.,0.0, 1.0)
		vec3 c0 = mix(white,colors[0], fade);
		vec3 c1 = mix(white,colors[1], fade);
		vec3 c2 = mix(white,colors[2], fade);
		vec3 c3 = mix(white,colors[3], fade);
		vec3 c4 = mix(white,colors[4], fade);

		vec3 col = mix(mix(mix(c0, c1, c/h1), mix(c1, c2, (c - h1)/(h0 - h1)), step(h1, c)), mix(mix(c2, c3, (c-h2)/(h2-h0)+1. ), mix(c3, c4, (c - h2)/(1.0 - h2)), step(h2, c)), step(h0,c));
		


		return vec3(col);
}


vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
	const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
	const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
	vec3 i  = floor(v + dot(v, C.yyy) );
	vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
	vec3 g = step(x0.yzx, x0.xyz);
	vec3 l = 1.0 - g;
	vec3 i1 = min( g.xyz, l.zxy );
	vec3 i2 = max( g.xyz, l.zxy );

	//  x0 = x0 - 0. + 0.0 * C 
	vec3 x1 = x0 - i1 + 1.0 * C.xxx;
	vec3 x2 = x0 - i2 + 2.0 * C.xxx;
	vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
	i = mod(i, 389.0 ); 
	vec4 p = permute( permute( permute( 
						 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
					 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
					 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
	float n_ = 1.0/7.0; // N=7
	vec3  ns = n_ * D.wyz - D.xzx;

	vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

	vec4 x_ = floor(j * ns.z);
	vec4 y_ = floor(j - 7. * x_ );    // mod(j,N)

	vec4 x = x_ *ns.x + ns.yyyy;
	vec4 y = y_ *ns.x + ns.yyyy;
	vec4 h = 1.0 - abs(x) - abs(y);

	vec4 b0 = vec4( x.xy, y.xy );
	vec4 b1 = vec4( x.zw, y.zw );

	vec4 s0 = floor(b0)*2.0 + 1.0;
	vec4 s1 = floor(b1)*2.0 + 1.0;
	vec4 sh = -step(h, vec4(0.0));

	vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
	vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

	vec3 p0 = vec3(a0.xy,h.x);
	vec3 p1 = vec3(a0.zw,h.y);
	vec3 p2 = vec3(a1.xy,h.z);
	vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
	vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	p0 *= norm.x;
	p1 *= norm.y;
	p2 *= norm.z;
	p3 *= norm.w;

// Mix final noise value
	vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	m = m * m;
	return 42. * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
																dot(p2,x2), dot(p3,x3) ) );
}


float distanceToLine(vec2 a, vec2 b, vec2 p) {
		float aside = dot((p - a),(b - a));
		if(aside< 0.0) return length(p-a);
		float bside = dot((p - b),(a - b));
		if(bside< 0.0) return length(p-b);
		vec2 pointOnLine = (bside*a + aside*b)/pow(length(a-b),2.0);
		
		return length(p - pointOnLine);
}

vec3 distanceColor(vec2 a, vec2 b, vec2 p) {

	vec2 pointOnLine;
		float aside = dot((p - a),(b - a));
		if(aside< 0.0) pointOnLine = a;
		float bside = dot((p - b),(a - b));
		if(bside< 0.0) pointOnLine = b;
		
		if(aside>0.0 && bside>0.0) pointOnLine = (bside*a + aside*b)/pow(length(a-b),2.0);
		
		vec2 toCenter = pointOnLine-p;
		float angle = atan(toCenter.y,toCenter.x);
		float radius = length(toCenter);

		// Map the angle (-PI to PI) to the Hue (from 0 to 1)
		// and the Saturation to the radius
		//vec3 color = vec3(custCol(sin(angle/TWO_PI)*2.));
		vec3 color = vec3(custCol(sin(strokeRotation/TWO_PI)*4.));
		//vec3 color = vec3(custCol(sin(u_time/20.)*2.));
		
		return color;
}

float map(float value, float min1, float max1, float min2, float max2) {
	return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// vec3 line(vec2 a, vec2 b, vec2 p, vec3 fg, vec3 bg ){
// 	 float max = 1.0;
// 	//float distance = smoothstep(0.0,1.0,min(distanceToLine(a, b, p)*80., max));
// 	float distance = smoothstep(0.0,1.0,distance(p, u_mouse)*20.);
	
// 	//smoothstep(0.2,2.5, abs(sin(u_time/5.)/2.)+distance(p,a) )
	
// 	vec3 fgn = distanceColor(a, b, p);
// 	vec3 color = mix(fgn, bg, distance);

// 	return color;
// }



vec4 sharpenMask ()
{
		// Sharpen detection matrix [0,1,0],[1,-4,1],[0,1,0]
		// Colors
		vec4 up = texture2D(tex, (gl_FragCoord.xy + vec2 (0, 1))/u_resolution.xy);
		vec4 left = texture2D(tex, (gl_FragCoord.xy + vec2 (-1, 0))/u_resolution.xy);
		vec4 center = texture2D(tex, gl_FragCoord.xy/u_resolution.xy);
		vec4 right = texture2D(tex, (gl_FragCoord.xy + vec2 (1, 0))/u_resolution.xy);
		vec4 down = texture2D(tex, (gl_FragCoord.xy + vec2 (0, -1))/u_resolution.xy);
		
		// Return edge detection
		return (1.0 + 4.0*16.0)*center -16.0*(up + left + right + down);
}



vec3 line(vec2 a, vec2 b, vec2 p, vec3 fg, vec3 bg ){
  //float distance = pow(distanceToLine(a, b, p), 0.5);
  
  float distance = smoothstep(strokeThickness,strokeThickness+strokeBlur+random(p)/300., distanceToLine(a, b, p));
  
  vec3 fgn = distanceColor(a, b, p);
  vec3 color = mix(fgn, bg, distance);

  return color;
}



void main() {


		vec2 coord = gl_FragCoord.xy;
		vec2 p = gl_FragCoord.xy/u_resolution.xy/2.;
		float ratio = u_resolution.x / u_resolution.y; 
		p.x = p.x*ratio;
		//p.y = 1.0-p.y;
		//p.x = p.x/1.5;
		vec2 pixel = 1.0/u_resolution.xy; // change if acting weird to 0.5
		vec2 circle = vec2(0.5,0.1);
		float nrs = random(p)/20.;

		vec2 uv = vTexCoord;
				uv.y = 1.0 - uv.y;


		vec3 finalColor ;

		vec3 current = texture2D(tex, uv).rgb;
		//current = mix(current,texture2D(tex, uv-vec2(uv.x-0.5, uv.y-0.5)/u_resolution.xy*10.).rgb,  0.5);
		current = mix(current, bgColor, strokeFade);

		current = line(point1, point2 ,p,vec3(209./255., 2./255., 89./255.),current);

		finalColor = current;

		gl_FragColor = vec4(finalColor,1.0);
						

				
}


