import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

// Global variables
let scene, camera, renderer, controls;
let cube, particles, particleSystem;
let currentFace = 'profile';
let autoRotate = false;
let rotationSpeed = 0.5;
let particleEffects = true;

// DOM elements
const root = document.documentElement;
const themeBtn = document.getElementById('themeToggle');
const fullscreenBtn = document.getElementById('fullscreenToggle');
const loadingScreen = document.getElementById('loadingScreen');
const sceneEl = document.getElementById('scene');
const panelEl = document.getElementById('panel');
const rotationSpeedSlider = document.getElementById('rotationSpeed');
const autoRotateCheckbox = document.getElementById('autoRotate');
const particleEffectsCheckbox = document.getElementById('particleEffects');

// Theme management
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') root.classList.add('light');

themeBtn.addEventListener('click', () => {
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
});

// Fullscreen toggle
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Control event listeners
rotationSpeedSlider.addEventListener('input', (e) => {
  rotationSpeed = parseFloat(e.target.value);
});

autoRotateCheckbox.addEventListener('change', (e) => {
  autoRotate = e.target.checked;
  if (controls) controls.autoRotate = autoRotate;
});

particleEffectsCheckbox.addEventListener('change', (e) => {
  particleEffects = e.target.checked;
  if (particleSystem) {
    particleSystem.visible = particleEffects;
  }
});

// WebGL detection with better error handling
const hasWebGL = (() => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported');
      return false;
    }
    
    // Test if WebGL is actually working
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      console.log('WebGL Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    }
    
    return true;
  } catch (e) { 
    console.error('WebGL detection failed:', e);
    return false; 
  }
})();

if (!hasWebGL) {
  console.warn('WebGL not available, showing fallback content');
  document.body.classList.add('no-webgl');
  loadingScreen.style.display = 'none';
}

// Data loading with better error handling
async function loadData() {
  try {
    console.log('Loading data.json...');
    const res = await fetch('data.json');
    console.log('Data response status:', res.status);
    
    if (!res.ok) {
      throw new Error(`Failed to load data.json: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log('Data loaded successfully:', data.name);
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

// Texture creation functions
function makeLabelTexture(text, sub = '', color = '#8ab4ff') {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  
  // Create gradient background
  const g1 = ctx.createLinearGradient(0, 0, 1024, 1024);
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const accent2 = getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim();
  g1.addColorStop(0, accent); g1.addColorStop(1, accent2);
  
  // Background
  ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, 1024, 1024);
  ctx.fillStyle = g1; ctx.globalAlpha = 0.15; ctx.fillRect(0, 0, 1024, 1024);
  ctx.globalAlpha = 1;
  
  // Main text
  ctx.fillStyle = color;
  ctx.font = '700 84px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 512, 380);
  
  // Subtitle
  if (sub) {
    ctx.font = '400 44px Inter, system-ui, sans-serif';
    wrapText(ctx, sub, 512, 480, 860, 56);
  }
  
  return new THREE.CanvasTexture(c);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function makePhotoTexture() {
  const tex = new THREE.TextureLoader().load('assets/avatar.jpg', 
    // Success callback
    (texture) => {
      console.log('Avatar texture loaded successfully');
    },
    // Progress callback
    (progress) => {
      console.log('Loading avatar texture:', (progress.loaded / progress.total * 100) + '%');
    },
    // Error callback
    (error) => {
      console.error('Error loading avatar texture:', error);
      // Create a fallback texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#8ab4ff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#000';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('AS', 128, 150);
      tex.image = canvas;
      tex.needsUpdate = true;
    }
  );
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Create particle system
function createParticleSystem() {
  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    
    colors[i * 3] = Math.random() * 0.5 + 0.5;
    colors[i * 3 + 1] = Math.random() * 0.5 + 0.5;
    colors[i * 3 + 2] = Math.random() * 0.5 + 0.5;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  
  return new THREE.Points(geometry, material);
}

// Panel content functions
function sectionProfile(data) {
  panelEl.innerHTML = `
    <h2>${data.name}</h2>
    <p class="meta">${data.role} · ${data.location}</p>
    <p>${data.profile}</p>
    <div class="chips">
      ${Object.entries(data.links).map(([k,v]) => 
        `<a class="chip" href="${v}" target="_blank" rel="noopener">${k}</a>`
      ).join('')}
    </div>
  `;
}

function sectionSkills(data) {
  panelEl.innerHTML = `
    <h2>Skills</h2>
    <div class="chips">
      ${data.skills.map(s => `<span class="chip">${s}</span>`).join('')}
    </div>
  `;
}

function sectionExperience(data) {
  panelEl.innerHTML = `
    <h2>Experience</h2>
    ${data.experience.map(e => `
      <div class="job">
        <strong>${e.title}</strong> — ${e.company} <span class="meta">(${e.dates})</span>
        <ul>${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
        ${e.achievements ? `
          <div class="achievements">
            <strong>Key Achievements:</strong> ${e.achievements.join(', ')}
          </div>
        ` : ''}
      </div>
    `).join('')}
  `;
}

function sectionProjects(data) {
  panelEl.innerHTML = `
    <h2>Projects</h2>
    ${data.projects.map(p => `
      <div class="proj">
        <strong>${p.name}</strong> <span class="meta">(${p.dates})</span>
        <p>${p.summary}</p>
        <div class="chips">${p.stack.map(s => `<span class="chip">${s}</span>`).join('')}</div>
        <div class="chips">
          ${Object.entries(p.links).map(([k,v]) => 
            `<a class="chip" href="${v}" target="_blank">${k}</a>`
          ).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function sectionEducation(data) {
  panelEl.innerHTML = `
    <h2>Education</h2>
    ${data.education.map(e => `
      <div class="job">
        <strong>${e.degree}</strong>
        <p class="meta">${e.institution}</p>
      </div>
    `).join('')}
  `;
}

function sectionContact(data) {
  panelEl.innerHTML = `
    <h2>Contact</h2>
    <p><a href="mailto:${data.email}">${data.email}</a> • <a href="tel:${data.phone}">${data.phone}</a></p>
    <div class="chips">
      ${Object.entries(data.links).map(([k,v]) => 
        `<a class="chip" href="${v}" target="_blank" rel="noopener">${k}</a>`
      ).join('')}
    </div>
  `;
}

// Main application
(async function main() {
  try {
    const data = await loadData();
    
    // Initialize Three.js scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0b0c0e, 10, 50);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 48), 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 48);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0b0c0e, 1);
    sceneEl.appendChild(renderer.domElement);
    
    console.log('Renderer created successfully');
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = rotationSpeed;
    controls.target.set(0, 0, 0);
    
    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x202030, 1.0);
    scene.add(hemi);
    
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 5, 7);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    scene.add(dir);
    
    // Ambient light for better visibility
    const ambient = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambient);
    
    // Add point lights for dramatic effect
    const pointLight1 = new THREE.PointLight(0x8ab4ff, 0.8, 15);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x7df9c6, 0.6, 12);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);
    
    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ 
        color: 0x0f1117, 
        metalness: 0.1, 
        roughness: 0.9 
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create a multi-colored cube with resume sections
    const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
    
    // Add clickable face data
    const faceData = [
      { 
        title: 'PROFILE', 
        content: 'Arushi Singh',
        color: '#ff6b6b',
        faceKey: 'profile',
        description: 'View Profile'
      },
      { 
        title: 'SKILLS', 
        content: data.skills.slice(0, 4).join(' • '),
        color: '#4ecdc4',
        faceKey: 'skills',
        description: 'View Skills'
      },
      { 
        title: 'EXPERIENCE', 
        content: data.experience.map(e => e.title).join(' • '),
        color: '#45b7d1',
        faceKey: 'experience',
        description: 'View Experience'
      },
      { 
        title: 'PROJECTS', 
        content: data.projects.map(p => p.name).join(' • '),
        color: '#f9ca24',
        faceKey: 'projects',
        description: 'View Projects'
      },
      { 
        title: 'EDUCATION', 
        content: data.education.map(e => e.degree).join(' • '),
        color: '#a55eea',
        faceKey: 'education',
        description: 'View Education'
      },
      { 
        title: 'CONTACT', 
        content: `${data.email} • ${data.phone}`,
        color: '#26de81',
        faceKey: 'contact',
        description: 'View Contact'
      }
    ];
    
    // Create enhanced materials with textures and effects
    const materials = faceData.map(face => 
      new THREE.MeshStandardMaterial({ 
        map: makeLabelTexture(face.title, face.content, face.color),
        color: new THREE.Color(face.color),
        metalness: 0.3,
        roughness: 0.4,
        emissive: new THREE.Color(face.color).multiplyScalar(0.2)
      })
    );
    
    cube = new THREE.Mesh(cubeGeometry, materials);
    cube.position.set(0, 0, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    
    // Add floating icons around the cube
    const iconGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const icons = [];
    const iconPositions = [
      { x: 4, y: 2, z: 0 },
      { x: -4, y: -2, z: 0 },
      { x: 0, y: 4, z: 2 },
      { x: 0, y: -4, z: -2 },
      { x: 2, y: 0, z: 4 },
      { x: -2, y: 0, z: -4 }
    ];
    
    iconPositions.forEach((pos, index) => {
      const iconMaterial = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color(faceData[index].color),
        transparent: true,
        opacity: 0.6
      });
      const icon = new THREE.Mesh(iconGeometry, iconMaterial);
      icon.position.set(pos.x, pos.y, pos.z);
      icon.userData = { 
        originalPosition: { ...pos }, 
        speed: 0.02 + Math.random() * 0.03,
        faceData: faceData[index]
      };
      scene.add(icon);
      icons.push(icon);
    });
    
    console.log('Enhanced 3D resume cube created');
    console.log('Cube size: 3x3x3');
    console.log('6 textured faces with floating icons');
        console.log('Interactive face data added');



    
    console.log('Cube created and added to scene');
    console.log('Cube position:', cube.position);
    console.log('Camera position:', camera.position);
    console.log('Cube size: 3x3x3');
    console.log('Interactive face data added');
    console.log('Enhanced 3D resume should now be visible!');
    
    // Particle system
    particleSystem = createParticleSystem();
    particleSystem.visible = particleEffects;
    scene.add(particleSystem);
    
    // Add subtle rotation to the dodecahedron
    cube.userData = { baseRotation: 0 };
    
    // Simple hover effect
    let isHovering = false;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Tooltip functionality
    function showTooltip(text, x, y) {
      // Remove existing tooltip
      const existingTooltip = document.getElementById('tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      
      // Create new tooltip
      const tooltip = document.createElement('div');
      tooltip.id = 'tooltip';
      tooltip.textContent = text;
      tooltip.style.cssText = `
        position: fixed;
        top: ${y - 40}px;
        left: ${x + 10}px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        pointer-events: none;
        transition: opacity 0.3s;
      `;
      
      document.body.appendChild(tooltip);
      
      // Remove tooltip after 2 seconds
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.remove();
        }
      }, 2000);
    }
    
    function pick() {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(cube, true);
      const iconHits = raycaster.intersectObjects(icons);
      
      if (hits.length > 0 || iconHits.length > 0) {
        if (!isHovering) {
          document.body.style.cursor = 'pointer';
          isHovering = true;
        }
      } else {
        if (isHovering) {
          document.body.style.cursor = 'default';
          isHovering = false;
        }
      }
    }
    
    // Rotation function for cube
    function rotateTo(faceKey) {
      const targetQuaternion = new THREE.Quaternion();
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      
      // Cube rotation angles for each section
      switch(faceKey) {
        case 'profile':    euler.set(0, 0, 0); break;
        case 'skills':     euler.set(0, Math.PI, 0); break;
        case 'experience': euler.set(-Math.PI/2, 0, 0); break;
        case 'projects':   euler.set(Math.PI/2, 0, 0); break;
        case 'education':  euler.set(0, Math.PI/2, 0); break;
        case 'contact':    euler.set(0, -Math.PI/2, 0); break;
        default:           euler.set(0, 0, 0); break;
      }
      
      targetQuaternion.setFromEuler(euler);
      const start = new THREE.Quaternion().copy(cube.quaternion);
      const duration = 1000;
      const t0 = performance.now();
      
      function animate() {
        const t = (performance.now() - t0) / duration;
        if (t >= 1) {
          cube.quaternion.copy(targetQuaternion);
        } else {
          // Use easing function for smoother animation
          const easedT = 1 - Math.pow(1 - t, 3);
          cube.quaternion.slerpQuaternions(start, targetQuaternion, easedT);
          requestAnimationFrame(animate);
        }
      }
      animate();
      
      // Update panel content
      switch(faceKey) {
        case 'profile': sectionProfile(data); break;
        case 'skills': sectionSkills(data); break;
        case 'experience': sectionExperience(data); break;
        case 'projects': sectionProjects(data); break;
        case 'education': sectionEducation(data); break;
        case 'contact': sectionContact(data); break;
      }
      
      // Update active nav button
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-face="${faceKey}"]`).classList.add('active');
      
      currentFace = faceKey;
    }
    
    // Event listeners
    function onResize() {
      const h = window.innerHeight - 48;
      camera.aspect = window.innerWidth / h;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, h);
    }
    
    window.addEventListener('resize', onResize);
    
    sceneEl.addEventListener('pointermove', (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    
    sceneEl.addEventListener('click', (event) => {
      if (isHovering) {
        // Get the clicked face
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(cube, true);
        
        if (intersects.length > 0) {
          const faceIndex = intersects[0].face.materialIndex;
          const face = faceData[faceIndex];
          
          // Show tooltip
          showTooltip(face.description, event.clientX, event.clientY);
          
          // Rotate to the clicked face
          rotateTo(face.faceKey);
        }
      }
      
      // Check for icon clicks
      raycaster.setFromCamera(mouse, camera);
      const iconIntersects = raycaster.intersectObjects(icons);
      
      if (iconIntersects.length > 0) {
        const clickedIcon = iconIntersects[0].object;
        const face = clickedIcon.userData.faceData;
        
        // Show tooltip
        showTooltip(face.description, event.clientX, event.clientY);
        
        // Rotate to the clicked face
        rotateTo(face.faceKey);
      } else {
        console.log('Cube clicked!');
        // Rotate to show different faces
        cube.rotation.y += Math.PI / 2;
      }
    });
    
    // Add navigation button functionality
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const faceKey = btn.dataset.face;
        console.log('Navigating to:', faceKey);
        
        // Rotate cube based on section
        switch(faceKey) {
          case 'profile': cube.rotation.set(0, 0, 0); break;
          case 'skills': cube.rotation.set(0, Math.PI, 0); break;
          case 'experience': cube.rotation.set(-Math.PI/2, 0, 0); break;
          case 'projects': cube.rotation.set(Math.PI/2, 0, 0); break;
          case 'education': cube.rotation.set(0, Math.PI/2, 0); break;
          case 'contact': cube.rotation.set(0, -Math.PI/2, 0); break;
        }
        
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Animation loop
    function tick() {
      controls.update();
      pick();
      
      // Animate particles
      if (particleSystem && particleEffects) {
        particleSystem.rotation.y += 0.001;
        particleSystem.rotation.x += 0.0005;
      }
      
      // Auto-rotate cube if enabled
      if (autoRotate && !controls.autoRotate) {
        cube.rotation.y += 0.01 * rotationSpeed;
      }
      // Removed automatic rotation when autoRotate is false
      
      // Animate floating icons
      icons.forEach(icon => {
        icon.rotation.y += icon.userData.speed;
        icon.rotation.x += icon.userData.speed * 0.5;
        
        // Floating motion
        const time = Date.now() * 0.001;
        const originalPos = icon.userData.originalPosition;
        icon.position.y = originalPos.y + Math.sin(time + icon.userData.speed * 10) * 0.5;
        icon.position.x = originalPos.x + Math.cos(time + icon.userData.speed * 10) * 0.3;
        
        // Hover effect - check if mouse is over this icon
        raycaster.setFromCamera(mouse, camera);
        const iconHits = raycaster.intersectObject(icon);
        if (iconHits.length > 0) {
          icon.scale.setScalar(1.5);
          icon.material.opacity = 1.0;
        } else {
          icon.scale.setScalar(1.0);
          icon.material.opacity = 0.6;
        }
      });
      

      
      // No automatic cube rotation - only manual control
      
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    
    // Initialize with profile
    rotateTo('profile');
    
    // Hide loading screen
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }, 1000);
    
    tick();
    
  } catch (error) {
    console.error('Error in main function:', error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--panel);
      border: 1px solid var(--error);
      padding: 2rem;
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
      z-index: 1000;
    `;
    errorDiv.innerHTML = `
      <h3 style="color: var(--error); margin-top: 0;">Something went wrong</h3>
      <p>There was an error loading the interactive resume. Please refresh the page or try again later.</p>
      <button onclick="location.reload()" style="
        background: var(--accent);
        color: #000;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
      ">Refresh Page</button>
    `;
    document.body.appendChild(errorDiv);
    
    // Fallback to static content
    document.body.classList.add('no-webgl');
    loadingScreen.style.display = 'none';
  }
})();