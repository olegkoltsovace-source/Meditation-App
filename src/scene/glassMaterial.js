import * as THREE from "three";

// A glass / soap-bubble look:
// clear in the middle, bright at the edges (a "fresnel" effect), plus one small shine.

const vertexShader = /* glsl */ `
  varying vec3 surfaceNormal;
  varying vec3 directionToCamera;

  void main() {
    vec4 positionSeenFromCamera = modelViewMatrix * vec4(position, 1.0);
    surfaceNormal = normalize(normalMatrix * normal);
    directionToCamera = normalize(-positionSeenFromCamera.xyz);
    gl_Position = projectionMatrix * positionSeenFromCamera;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 bodyColor;
  uniform vec3 rimColor;
  uniform float opacity;      // fades the whole object in and out
  uniform float bodyOpacity;  // how see-through the middle is (0 = clear, 1 = solid)
  uniform float shineStrength; // the white shine spot: 1 = full, 0 = none

  varying vec3 surfaceNormal;
  varying vec3 directionToCamera;

  void main() {
    // 1.0 where the surface faces us, 0.0 at the outline of the sphere
    float facingCamera = clamp(dot(surfaceNormal, directionToCamera), 0.0, 1.0);
    float rim = pow(1.0 - facingCamera, 2.4);

    // a small shine from a light at the top left
    vec3 lightDirection = normalize(vec3(-0.45, 0.6, 0.65));
    float shine = pow(max(dot(surfaceNormal, lightDirection), 0.0), 28.0) * shineStrength;

    vec3 color = mix(bodyColor, rimColor, rim) + shine * 0.9;
    float alpha = (bodyOpacity + rim * (1.0 - bodyOpacity) + shine) * opacity;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

export const createGlassMaterial = ({
  bodyColor,
  rimColor,
  bodyOpacity,
  shineStrength = 1,
}) =>
  new THREE.ShaderMaterial({
    uniforms: {
      bodyColor: { value: bodyColor },
      rimColor: { value: rimColor },
      opacity: { value: 1 },
      bodyOpacity: { value: bodyOpacity },
      shineStrength: { value: shineStrength },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false, // see-through objects shouldn't block each other
  });
