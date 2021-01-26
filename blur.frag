precision mediump float;

uniform float treble;
uniform float bass;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_direction;
uniform float uIteration;
uniform vec2 u_resolution;

varying vec2 vTexCoord;
// // lets grab texcoords just for fun
// varying vec2 vTexCoord;

// // our texture coming from p5
// uniform sampler2D tex;
// uniform vec2 texelSize;

// void main() {
//   vec2 uv = vTexCoord;
//   // the texture is loaded upside down and backwards by default so lets flip it
//   uv.y = 1.0 - uv.y;

//   // spread controls how far away from the center we should pull a sample from
//   // you will start to see artifacts if you crank this up too high
//   float spread = 1.0;

//   // create our offset variable by multiplying the size of a texel with spread
//   vec2 offset = texelSize * spread;

//   // get all the neighbor pixels!
//   vec4 tex1 = texture2D(tex, uv); // middle middle -- the actual texel / pixel
//   tex1 += texture2D(tex, uv + vec2(-offset.x, -offset.y)); // top left
//   tex1 += texture2D(tex, uv + vec2(0.0, -offset.y)); // top middle
//   tex1 += texture2D(tex, uv + vec2(offset.x, -offset.y)); // top right

//   tex1 += texture2D(tex, uv + vec2(-offset.x, 0.0)); //middle left
//   tex1 += texture2D(tex, uv + vec2(offset.x, 0.0)); //middle right

//   tex1 += texture2D(tex, uv + vec2(-offset.x, offset.y)); // bottom left
//   tex1 += texture2D(tex, uv + vec2(0.0, offset.y)); // bottom middle
//   tex1 += texture2D(tex, uv + vec2(offset.x, offset.y)); // bottom right

//   // we added 9 textures together, so we will divide by 9 to average them out and move the values back into a 0 - 1 range
//   tex1 /= 9.0;

//   gl_FragColor = tex1;
// }

uniform sampler2D tex;
uniform vec2 texelSize;
uniform vec2 direction;


float normpdf(in float x, in float sigma)
{
  return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
}


 
vec3 gaussianBlur( sampler2D t, vec2 texUV, vec2 stepSize ){   
  // a variable for our output                                                                                                                                                                 
  vec3 colOut = vec3( 0.0 );                                                                                                                                   

  // stepCount is 9 because we have 9 items in our array , const means that 9 will never change and is required loops in glsl                                                                                                                                     
  const int stepCount = 9;

  // these weights were pulled from the link above
  float gWeights[stepCount];
      gWeights[0] = 0.10855;
      gWeights[1] = 0.13135;
      gWeights[2] = 0.10406;
      gWeights[3] = 0.07216;
      gWeights[4] = 0.04380;
      gWeights[5] = 0.02328;
      gWeights[6] = 0.01083;
      gWeights[7] = 0.00441;
      gWeights[8] = 0.00157;

  // these offsets were also pulled from the link above
  float gOffsets[stepCount];
      gOffsets[0] = 0.66293;
      gOffsets[1] = 2.47904;
      gOffsets[2] = 4.46232;
      gOffsets[3] = 6.44568;
      gOffsets[4] = 8.42917;
      gOffsets[5] = 10.41281;
      gOffsets[6] = 12.39664;
      gOffsets[7] = 14.38070;
      gOffsets[8] = 16.36501;
  
  // lets loop nine times
  for( int i = 0; i < stepCount; i++ ){  

    // multiply the texel size by the by the offset value                                                                                                                                                               
      vec2 texCoordOffset = gOffsets[i] * stepSize;

    // sample to the left and to the right of the texture and add them together                                                                                                           
      vec3 col = texture2D( t, texUV + texCoordOffset ).xyz + texture2D( t, texUV - texCoordOffset ).xyz; 

    // multiply col by the gaussian weight value from the array
    col *= gWeights[i];

    // add it all up
      colOut +=  col;                                                                                                                               
  }

  // our final value is returned as col out
  return colOut;                                                                                                                                                   
} 


vec2 rand( vec2  p ) { p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) ); return fract(sin(p)*43758.5453); }



vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}



void main(void) {

 // vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  //uv = 1.0 - uv;
  // use our blur function




    vec2 uv = gl_FragCoord.xy / u_resolution.xy/2.;
    
    float strength = cos(u_time/20.)*0.1;
    vec4 noiseBlur = texture2D( tex, uv + strength*(rand(uv)-0.5));

     // const float Pi = 6.28318530718; // Pi*2

    gl_FragColor = blur9(tex, uv, u_resolution.xy, u_direction);

// -- - - - - - - - - - - - - - - - - -- -- - - - -
// REALLY NICE BLUR, BUT HEAVY
// // Normalized pixel coordinates (from 0 to 1)
//     vec2 uv =  gl_FragCoord.xy / u_resolution.xy/2.;

//     if(uv.x > u_mouse.x){
//         gl_FragColor = vec4(texture2D( tex, uv).xyz, 1.0);
//         return;
//     }

//     // Define the bluring radius/strength (direction independant)
//     const vec2 radius = vec2(10.0);
//     // Calculate the value at the corners so that the matrix can be easily inverted
//     float max = sqrt(radius.x * radius.x + radius.y * radius.y);
//     // Define the variable which will hold the blured values
//     vec3 blur = vec3(0.0);

//     // Define the variable which will be used to normalize the image
//     float sum = 0.0;
//     // The kernel is dynamically created based on the bluring radius
//     for(float u = -radius.x; u<=radius.x; u++){
//         for(float v = -radius.y; v<=radius.y; v++){
//             // The pixel weight used by the kernel is defined as: the distance from the kernel origin (0,0)
//             // to the current kernel position, subtracted from the maximum possible distance. This leads
//             // to a gradient from 0% relative weight on the edges to 100% relative weight at the origin of the kernel
//             float weight = max - sqrt(u * u + v * v);
//             // The weight is then exponentialized which seams to sleightly maintain more of the origianl detail
//             //weight = pow(weight, 2.0);
//             // The weight is then multiplied by the texture being sampled and added to the overall blurred values
//             blur += weight * texture2D( tex, uv + (vec2(u, v)/u_resolution.xy/2.)).xyz;
//             // The weight is then added for normalizing purposes
//             sum += weight;
//         }
//     }
//     // Finally the blurred image is normalized
//     blur /= sum;

//     // Output to screen
//     gl_FragColor = vec4(blur , 1.0);
// -- - - - - - - - - - - - - - - - - -- -- - - - -





// -- - - - - - - - - - - - - - - - - -- -- - - - -
  //GOOD WORKING VERSION

    // const float Pi = 6.28318530718; // Pi*2
    
    // // GAUSSIAN BLUR SETTINGS {{{
    // const float Directions = 16.0; // BLUR DIRECTIONS (Default 16.0 - More is better but slower)
    // const float Quality = 10.0; // BLUR QUALITY (Default 4.0 - More is better but slower)
    // float Size = sin(u_time/2.)*50.; // BLUR SIZE (Radius)
    // // GAUSSIAN BLUR SETTINGS }}}
   
    // vec2 Radius = Size/u_resolution.xy;
    
    // // Normalized pixel coordinates (from 0 to 1)
    // vec2 uv = gl_FragCoord.xy / u_resolution.xy/2.;
    // // Pixel colour
    // vec4 Color = texture2D(tex, uv);
    
    // // Blur calculations
    // for( float d=0.0; d<Pi; d+=Pi/Directions)
    // {
    // for(float i=1.0/Quality; i<=1.0; i+=1.0/Quality)
    //     {
    //       Color += texture2D( tex, uv+vec2(cos(d),sin(d))*Radius*i);    
    //     }
    // }
    
    // // Output to screen
    // Color /= Quality * Directions - 15.0;
    // gl_FragColor =  Color;
// -- - - - - - - - - - - - - - - - - -- -- - - - -





//   vec3 c = texture2D(tex, gl_FragCoord.xy / u_resolution.xy/2.).rgb;

// //declare stuff
//     const int mSize = 31;
//     const int kSize = (mSize-1)/2;
//     float kernel[mSize];
//     vec3 final_colour = vec3(0.0);
    
//     //create the 1-D kernel
//     float sigma = 1.0;
//     float Z = 0.0;
//     for (int j = 0; j <= kSize; ++j)
//     {
//       kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);
//     }
    
//     //get the normalization factor (as the gaussian has been clamped)
//     for (int j = 0; j < mSize; ++j)
//     {
//       Z += kernel[j];
//     }
    
//     //read out the texels
//     for (int i=-kSize; i <= kSize; ++i)
//     {
//       for (int j=-kSize; j <= kSize; ++j)
//       {
//         final_colour += kernel[kSize+j]*kernel[kSize+i]*texture2D(tex, (gl_FragCoord.xy+vec2(float(i),float(j))) / u_resolution.xy/2.).rgb;
  
//       }
//     }
    
    
//     gl_FragColor = vec4(final_colour/(Z*Z), 1.0);

//----------------
  // if(mod(uIteration, 2.) == 0.){
  // blur = gaussianBlur(tex, uv, texelSize * vec2(1.0,0.0));
  // }
  // else{
  //   blur = gaussianBlur(tex, uv, texelSize * vec2(0.0,1.0));
  // }

  // gl_FragColor = vec4(blur, 1.0);

//     vec2 uv = vTexCoord;
//   // the texture is loaded upside down and backwards by default so lets flip it
//   uv.y = 1.0 - uv.y;
//    float wave = sin(uv.y*12. * bass/2. + u_time/4.)*0.01;
//   vec2 d = vec2(wave); // could be vec2(wave, 0.0) or vec2(0.0, wave) for distortion only in 1 axis.
//     vec4 image;
//   if(bass>0.4){
//    image = texture2D(tex, uv + d);
// }
// else{
//    image = vec4(255.,255.,255.,0.04);
// }
//   gl_FragColor = image;
}


