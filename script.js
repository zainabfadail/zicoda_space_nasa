// ============================================================================
// 1. قاعدة البيانات الهندسية للمهمة الفضائية
// ============================================================================
const BUDGET_CAP = 180;

const DESTINATIONS = {
    moon: {
        name: "THE MOON",
        solarMultiplier: 1.0,
        requiresHeavyShield: false,
        requiresDeepComm: false,
        color: 0xd1d5db,
        emissive: 0x222222,
        botInfo: "Target locked: The Moon! Close range (100% sunlight). Standard Solar Panels and Light Rocket work like a charm here!"
    },
    mars: {
        name: "MARS",
        solarMultiplier: 0.65,
        requiresHeavyShield: true,
        requiresDeepComm: true,
        color: 0xd97706,
        emissive: 0x451a03,
        botInfo: "Target locked: Mars! Sunlight drops to 65%. Equip the High-Gain Deep Space Dish & Reinforced Heat Shield before launch!"
    },
    europa: {
        name: "EUROPA (JUPITER)",
        solarMultiplier: 0.15,
        requiresHeavyShield: true,
        requiresDeepComm: true,
        color: 0x60a5fa,
        emissive: 0x1e3a8a,
        botInfo: "Target locked: Europa (Jupiter's icy moon)! Sunlight is only 15%—you MUST use the RTG Nuclear Battery, Heavy Shield & Deep Dish!"
    }
};

const ROCKETS = {
    light: {
        name: "Light Launcher (Falcon-Class)",
        cost: 40,
        maxMass: 1250,
        botInfo: "Look at the 3D viewport! Sleek Single-Core Light Rocket attached ($40M, Max 1,250 kg). Spinning and ready!"
    },
    heavy: {
        name: "Heavy SLS Rocket (Twin Boosters)",
        cost: 75,
        maxMass: 2800,
        botInfo: "Whoa! Massive Orange SLS Heavy Rocket with Twin Side Boosters attached ($75M, Max 2,800 kg)! Built for deep space!"
    }
};

const SUBSYSTEMS = {
    power: {
        solar: { name: "Standard Solar Panels", cost: 15, mass: 120, basePower: 350, isSolar: true, botInfo: "Standard Solar Wings unfolded! Great for Lunar orbit (+350W)." },
        solar_plus: { name: "Enhanced Dual Solar Arrays", cost: 28, mass: 190, basePower: 520, isSolar: true, botInfo: "Enhanced Dual Solar Arrays unfolded (+520W)! Strong enough to power a Mars mission!" },
        rtg: { name: "RTG Nuclear Battery", cost: 45, mass: 280, basePower: 600, isSolar: false, botInfo: "Glowing Red RTG Plutonium Nuclear Battery installed! Constant +600W in deep space!" }
    },
    comm: {
        uhf: { name: "Standard UHF Antenna", cost: 10, mass: 90, powerDraw: 60, isDeep: false, botInfo: "Standard UHF Whip Antenna mounted. Suitable for low-range Lunar telemetry." },
        deep: { name: "High-Gain Deep Space Dish", cost: 25, mass: 210, powerDraw: 140, isDeep: true, botInfo: "Rose-Gold Deep Space Dish mounted! Ready for interplanetary links from Mars & Jupiter!" }
    },
    shield: {
        light: { name: "Standard Thermal Coating", cost: 8, mass: 110, isHeavy: false, botInfo: "Lightweight thermal blanket applied." },
        heavy: { name: "Reinforced Heat & Radiation Shield", cost: 20, mass: 320, isHeavy: true, botInfo: "Heavy Heat & Radiation Shield mounted at the base of the spacecraft!" }
    }
};

const PAYLOADS = {
    cam: { name: "High-Res Multispectral Camera", cost: 15, mass: 150, powerDraw: 80, science: 25, botInfo: "Multispectral Camera added (+25% Science)! Watch the purple science orb appear on the hull!" },
    spec: { name: "Thermal Infrared Spectrometer", cost: 20, mass: 220, powerDraw: 110, science: 30, botInfo: "Thermal Spectrometer added (+30% Science)! Maps surface heat and ice minerals!" },
    radar: { name: "Ice-Penetrating Subsurface Radar", cost: 25, mass: 340, powerDraw: 150, science: 35, botInfo: "Subsurface Radar added (+35% Science)! Sees through underground ice oceans!" },
    rover: { name: "Autonomous AI Micro-Rover", cost: 35, mass: 480, powerDraw: 130, science: 40, botInfo: "Autonomous AI Micro-Rover loaded (+40% Science)! Ready to roll when we land on the planet!" }
};

const BASE_BUS = { cost: 20, mass: 350, powerDraw: 50 };

let currentConfig = {
    destination: 'moon',
    rocket: 'light',
    power: 'solar',
    comm: 'uhf',
    shield: 'light',
    payloads: ['cam']
};

// ============================================================================
// 2. نظام الروبوت الطائر مع 4 تعبيرات وحركات ملل طبيعية وهادئة (بدون دوران مزعج)
// ============================================================================
let mouseX = window.innerWidth * 0.62;
let mouseY = window.innerHeight * 0.72;
let botX = mouseX;
let botY = mouseY;
let lastMouseMoveTime = Date.now();
let lastBoredStageTime = 0;
let isBotBored = false;
let boredActionIndex = 0;

// قائمة حركات وتعبيرات الملل الـ 4 المتنوعة واللطيفة
const BORED_STATES = [
    {
        cssClass: 'bored-yawn',
        badgeText: 'BORED & SLEEPY 🥱',
        speech: "*Yaaawn* 🥱 It's so quiet in outer space... I'm getting a little sleepy waiting for your next engineering move, Zainab!"
    },
    {
        cssClass: 'bored-look',
        badgeText: 'LOOKING AROUND 👀',
        speech: "👀 Hmm... *looks left and right*... Are you still there Engineer Zainab? Let's test a new destination or payload!"
    },
    {
        cssClass: 'bored-sigh',
        badgeText: 'FEELING BORED 😑',
        speech: "😑 *Bored robot sigh*... My circuits are itching for action! Click any rocket or press 'LAUNCH' so we can fly to orbit!"
    },
    {
        cssClass: 'bored-flip-once',
        badgeText: 'PLAYFUL STRETCH 🤸‍♂️',
        speech: "🤸‍♂️ Hop! Just did a quick zero-gravity stretch to shake off the boredom! Ready whenever you are!"
    }
];

function clearBoredClasses() {
    const botEl = document.getElementById('floating-robot-companion');
    const botChar = document.getElementById('bot-char');
    if (botEl) botEl.classList.remove('mood-bored');
    if (botChar) {
        botChar.classList.remove('bored-yawn', 'bored-look', 'bored-sigh', 'bored-flip-once');
    }
}

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    lastMouseMoveTime = Date.now();

    // بمجرد أن تحركي الماوس، يستيقظ الروبوت فوراً من الملل ويعود لحالته المنتبهة!
    if (isBotBored) {
        isBotBored = false;
        clearBoredClasses();
        updateSystem(); // استعادة حالة السعادة أو التحذير الهندسي
    }
});

function triggerNextBoredBehavior() {
    const botEl = document.getElementById('floating-robot-companion');
    const botChar = document.getElementById('bot-char');
    const moodTag = document.getElementById('bot-mood-tag');
    if (!botEl || !botChar) return;

    clearBoredClasses();
    botEl.classList.add('mood-bored');

    const state = BORED_STATES[boredActionIndex % BORED_STATES.length];
    boredActionIndex++;

    botChar.classList.add(state.cssClass);
    if (moodTag) moodTag.textContent = state.badgeText;
    setRobotSpeech(state.speech);
}

function updateFloatingRobotLoop() {
    const botEl = document.getElementById('floating-robot-companion');
    if (botEl) {
        const now = Date.now();
        const idleSeconds = (now - lastMouseMoveTime) / 1000;

        // إذا توقف الماوس لمدة 5 ثوانٍ، يبدأ الروبوت بالتعبير عن الملل ويغير حركته بهدوء كل 5 ثوانٍ
        if (idleSeconds > 5 && !isFlying) {
            if (!isBotBored) {
                isBotBored = true;
                lastBoredStageTime = now;
                triggerNextBoredBehavior();
            } else if (now - lastBoredStageTime > 5200) {
                lastBoredStageTime = now;
                triggerNextBoredBehavior();
            }
        }

        // حساب موقع الروبوت ليتبع الماوس بنعومة
        let targetX = mouseX - 315;
        let targetY = mouseY + 18;

        if (targetX < 15) targetX = mouseX + 28;
        if (targetX > window.innerWidth - 345) targetX = window.innerWidth - 345;
        if (targetY > window.innerHeight - 135) targetY = window.innerHeight - 135;
        if (targetY < 60) targetY = 60;

        botX += (targetX - botX) * 0.085;
        botY += (targetY - botY) * 0.085;

        botEl.style.left = `${botX}px`;
        botEl.style.top = `${botY}px`;
    }
    requestAnimationFrame(updateFloatingRobotLoop);
}

function setRobotSpeech(msg) {
    const textEl = document.getElementById('bot-speech-text');
    if (textEl) textEl.textContent = msg;
}

function pokeFloatingRobot() {
    lastMouseMoveTime = Date.now();
    isBotBored = false;
    clearBoredClasses();

    const botChar = document.getElementById('bot-char');
    botChar.classList.add('bored-flip-once');
    setTimeout(() => botChar.classList.remove('bored-flip-once'), 1100);

    const funTips = [
        "Hehe, that tickles! 💡 Pro Tip: For Mars on a Light Rocket, choose 'Enhanced Dual Solar Arrays'!",
        "Zero-G high five! ✋ Remember: Europa needs the RTG Nuclear Battery because sunlight is only 15% at Jupiter!",
        "Ready for liftoff? Click 'LAUNCH, LAND & RETURN' to watch our rocket stage-separate, land on the planet, and fly back!"
    ];
    setRobotSpeech(funTips[Math.floor(Math.random() * funTips.length)]);
    updateSystem();
}

// ============================================================================
// 3. تفاعل الأزرار وتحديث الحسابات الهندسية وتعبيرات الروبوت
// ============================================================================
function selectDestination(destKey) {
    if (isFlying) return;
    currentConfig.destination = destKey;
    document.querySelectorAll('#destination-group .option-card').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.dest === destKey);
    });
    setRobotSpeech(DESTINATIONS[destKey].botInfo);
    resetSpacecraftPosition();
    updateSystem();
}

function selectRocket(rocketKey) {
    if (isFlying) return;
    currentConfig.rocket = rocketKey;
    document.querySelectorAll('#rocket-group .option-card').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.rocket === rocketKey);
    });
    setRobotSpeech(ROCKETS[rocketKey].botInfo);
    updateSystem();
}

function onSubsystemChange(type, value) {
    if (isFlying) return;
    currentConfig[type] = value;
    setRobotSpeech(SUBSYSTEMS[type][value].botInfo);
    updateSystem();
}

function onPayloadClick(payloadKey, isChecked) {
    if (isFlying) return;
    const checkboxes = document.querySelectorAll('.payload-list input[type="checkbox"]:checked');
    currentConfig.payloads = Array.from(checkboxes).map(cb => cb.value);

    if (isChecked) {
        setRobotSpeech(PAYLOADS[payloadKey].botInfo);
    } else {
        setRobotSpeech(`Removed ${PAYLOADS[payloadKey].name}. Mass and power consumption reduced!`);
    }
    updateSystem();
}

function calculateTelemetry() {
    const dest = DESTINATIONS[currentConfig.destination];
    const rocket = ROCKETS[currentConfig.rocket];
    const pwr = SUBSYSTEMS.power[currentConfig.power];
    const comm = SUBSYSTEMS.comm[currentConfig.comm];
    const shld = SUBSYSTEMS.shield[currentConfig.shield];

    let totalCost = BASE_BUS.cost + rocket.cost + pwr.cost + comm.cost + shld.cost;
    let totalMass = BASE_BUS.mass + pwr.mass + comm.mass + shld.mass;
    let powerDraw = BASE_BUS.powerDraw + comm.powerDraw;
    let scienceScore = 0;

    currentConfig.payloads.forEach(pKey => {
        const item = PAYLOADS[pKey];
        totalCost += item.cost;
        totalMass += item.mass;
        powerDraw += item.powerDraw;
        scienceScore += item.science;
    });

    const powerSupply = pwr.isSolar ? Math.round(pwr.basePower * dest.solarMultiplier) : pwr.basePower;

    let warnings = [];
    if (totalCost > BUDGET_CAP) {
        warnings.push(`Budget Exceeded ($${totalCost}M > $${BUDGET_CAP}M)`);
    }
    if (totalMass > rocket.maxMass) {
        warnings.push(`Overweight (${totalMass}kg > ${rocket.maxMass}kg limit)`);
    }
    if (powerDraw > powerSupply) {
        warnings.push(`Power Deficit (${powerDraw}W needed vs ${powerSupply}W at ${dest.name})`);
    }
    if (dest.requiresDeepComm && !comm.isDeep) {
        warnings.push(`Signal Loss Risk: ${dest.name} requires Deep Space Dish`);
    }
    if (dest.requiresHeavyShield && !shld.isHeavy) {
        warnings.push(`Hazard: ${dest.name} requires Reinforced Heat Shield`);
    }
    if (currentConfig.payloads.length === 0) {
        warnings.push(`Zero Science: Select at least 1 instrument`);
    }

    return {
        dest, rocket, pwr, comm, shld,
        totalCost, totalMass, powerDraw, powerSupply, scienceScore, warnings
    };
}

function updateSystem() {
    const data = calculateTelemetry();

    document.getElementById('budget-text').textContent = `$${data.totalCost}M / $${BUDGET_CAP}M`;
    const budgetBar = document.getElementById('budget-bar');
    budgetBar.style.width = `${Math.min((data.totalCost / BUDGET_CAP) * 100, 100)}%`;
    budgetBar.style.background = data.totalCost > BUDGET_CAP ? 'var(--danger)' : 'var(--emerald)';

    document.getElementById('mass-text').textContent = `${data.totalMass} kg / ${data.rocket.maxMass} kg`;
    const massBar = document.getElementById('mass-bar');
    massBar.style.width = `${Math.min((data.totalMass / data.rocket.maxMass) * 100, 100)}%`;
    massBar.style.background = data.totalMass > data.rocket.maxMass ? 'var(--danger)' : 'var(--emerald)';

    document.getElementById('power-text').textContent = `${data.powerDraw} W / ${data.powerSupply} W`;
    const powerBar = document.getElementById('power-bar');
    powerBar.style.width = `${Math.min((data.powerDraw / Math.max(data.powerSupply, 1)) * 100, 100)}%`;
    powerBar.style.background = data.powerDraw > data.powerSupply ? 'var(--danger)' : 'var(--emerald)';

    document.getElementById('science-text').textContent = `${data.scienceScore}%`;
    document.getElementById('science-bar').style.width = `${Math.min(data.scienceScore, 100)}%`;

    const botEl = document.getElementById('floating-robot-companion');
    const moodTag = document.getElementById('bot-mood-tag');
    const strip = document.getElementById('eng-status-strip');
    const stripMsg = document.getElementById('strip-warnings');

    clearBoredClasses();

    if (data.warnings.length === 0) {
        botEl.classList.remove('mood-sad');
        botEl.classList.add('mood-happy');
        moodTag.textContent = "HAPPY & READY 😊";
        strip.classList.remove('strip-error');
        stripMsg.textContent = `✓ All constraints nominal for ${data.dest.name} (${data.scienceScore}% Science). Ready for Launch, Landing & Return!`;
    } else {
        botEl.classList.remove('mood-happy');
        botEl.classList.add('mood-sad');
        moodTag.textContent = `WARNING (${data.warnings.length}) 😟`;
        strip.classList.add('strip-error');
        stripMsg.textContent = `⚠️ ${data.warnings.join(' | ')}`;
        setRobotSpeech(`Uh-oh! Check my warning: ${data.warnings[0]}! Let's fix it before launching!`);
    }

    update3DSpacecraft();
}

// ============================================================================
// 4. محرك الفضاء ثلاثي الأبعاد: المركبة + الصواريخ الدوارة + الهبوط والعودة
// ============================================================================
let scene, camera, renderer;
let fullAssemblyGroup, spacecraftGroup, rocketStageGroup, lightRocketMeshGroup, heavySLSMeshGroup;
let planetGroup, planetMesh, scanLaserBeam, starsMesh, mainFlameMesh, upperFlameMesh;
let solarGroup, rtgGroup, dishGroup, uhfGroup, shieldRing, payloadGroup;
let isDragging = false, prevMouseX = 0, prevMouseY = 0;

let isFlying = false;
let missionTime = 0;

function init3DScene() {
    const container = document.getElementById('three-container');
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.4, 11.5);
    camera.lookAt(0, -0.3, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sunLight.position.set(12, 14, 10);
    scene.add(sunLight);

    const starGeo = new THREE.BufferGeometry();
    const starCount = 850;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
        starPos[i] = (Math.random() - 0.5) * 100;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starsMesh = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 }));
    scene.add(starsMesh);

    planetGroup = new THREE.Group();
    planetGroup.position.set(-5.2, 1.3, -9.0);
    scene.add(planetGroup);

    const planetGeo = new THREE.SphereGeometry(2.6, 36, 36);
    const planetMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.8 });
    planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planetMesh);

    fullAssemblyGroup = new THREE.Group();
    scene.add(fullAssemblyGroup);

    spacecraftGroup = new THREE.Group();
    spacecraftGroup.position.y = 1.35;
    fullAssemblyGroup.add(spacecraftGroup);

    const busMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.58, 1.35, 24),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.3 })
    );
    spacecraftGroup.add(busMesh);

    upperFlameMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 1.2, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    upperFlameMesh.rotation.x = Math.PI;
    upperFlameMesh.position.y = -1.2;
    upperFlameMesh.visible = false;
    spacecraftGroup.add(upperFlameMesh);

    scanLaserBeam = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 2.6, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.75 })
    );
    scanLaserBeam.position.y = -1.8;
    scanLaserBeam.visible = false;
    spacecraftGroup.add(scanLaserBeam);

    solarGroup = new THREE.Group();
    const panelGeo = new THREE.BoxGeometry(2.4, 0.06, 0.65);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.5, roughness: 0.2 });
    const leftWing = new THREE.Mesh(panelGeo, panelMat);
    leftWing.position.set(-1.75, 0, 0);
    const rightWing = new THREE.Mesh(panelGeo, panelMat);
    rightWing.position.set(1.75, 0, 0);
    solarGroup.add(leftWing, rightWing);
    spacecraftGroup.add(solarGroup);

    rtgGroup = new THREE.Group();
    const rtgCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 1.0, 12),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d })
    );
    rtgCyl.rotation.z = Math.PI / 3;
    rtgCyl.position.set(0.95, -0.2, 0);
    rtgGroup.add(rtgCyl);
    spacecraftGroup.add(rtgGroup);

    dishGroup = new THREE.Group();
    const dishMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 0.35, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xe6a4b4, side: THREE.DoubleSide, metalness: 0.6 })
    );
    dishMesh.rotation.x = Math.PI;
    dishMesh.position.set(0, 0.95, 0);
    dishGroup.add(dishMesh);
    spacecraftGroup.add(dishGroup);

    uhfGroup = new THREE.Group();
    const rodMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 1.0),
        new THREE.MeshBasicMaterial({ color: 0xe6a4b4 })
    );
    rodMesh.position.set(0, 1.1, 0);
    uhfGroup.add(rodMesh);
    spacecraftGroup.add(uhfGroup);

    shieldRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.82, 0.68, 0.22, 24),
        new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.7 })
    );
    shieldRing.position.set(0, -0.68, 0);
    spacecraftGroup.add(shieldRing);

    payloadGroup = new THREE.Group();
    spacecraftGroup.add(payloadGroup);

    rocketStageGroup = new THREE.Group();
    rocketStageGroup.position.y = -1.15;
    fullAssemblyGroup.add(rocketStageGroup);

    lightRocketMeshGroup = new THREE.Group();
    const lightBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 2.8, 24),
        new THREE.MeshStandardMaterial({ color: 0xf3f4f6, metalness: 0.3, roughness: 0.4 })
    );
    const lightBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.53, 0.53, 0.35, 24),
        new THREE.MeshStandardMaterial({ color: 0x111827 })
    );
    lightBand.position.y = 0.9;
    const lightNozzle = new THREE.Mesh(
        new THREE.ConeGeometry(0.36, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8 })
    );
    lightNozzle.position.y = -1.55;
    lightRocketMeshGroup.add(lightBody, lightBand, lightNozzle);

    for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.6, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1f2937 })
        );
        const angle = (i / 4) * Math.PI * 2;
        fin.position.set(Math.cos(angle) * 0.6, -1.1, Math.sin(angle) * 0.6);
        fin.rotation.y = -angle;
        lightRocketMeshGroup.add(fin);
    }
    rocketStageGroup.add(lightRocketMeshGroup);

    heavySLSMeshGroup = new THREE.Group();
    const slsCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68, 0.68, 3.0, 24),
        new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 })
    );
    const slsLeftBooster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 2.7, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    slsLeftBooster.position.set(-0.98, -0.1, 0);
    const slsLeftCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.28, 0.45, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    slsLeftCone.position.set(-0.98, 1.45, 0);

    const slsRightBooster = slsLeftBooster.clone();
    slsRightBooster.position.x = 0.98;
    const slsRightCone = slsLeftCone.clone();
    slsRightCone.position.x = 0.98;

    heavySLSMeshGroup.add(slsCore, slsLeftBooster, slsLeftCone, slsRightBooster, slsRightCone);
    rocketStageGroup.add(heavySLSMeshGroup);

    mainFlameMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.75, 2.4, 20),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.92 })
    );
    mainFlameMesh.rotation.x = Math.PI;
    mainFlameMesh.position.y = -2.7;
    mainFlameMesh.visible = false;
    rocketStageGroup.add(mainFlameMesh);

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || isFlying) return;
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        fullAssemblyGroup.rotation.y += dx * 0.01;
        fullAssemblyGroup.rotation.x += dy * 0.008;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    });

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z = Math.min(Math.max(camera.position.z + e.deltaY * 0.005, 6), 16);
    });

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    animate3D();
}

function update3DSpacecraft() {
    if (!fullAssemblyGroup) return;

    const dest = DESTINATIONS[currentConfig.destination];
    planetMesh.material.color.setHex(dest.color);
    planetMesh.material.emissive.setHex(dest.emissive);

    lightRocketMeshGroup.visible = (currentConfig.rocket === 'light');
    heavySLSMeshGroup.visible = (currentConfig.rocket === 'heavy');

    solarGroup.visible = (currentConfig.power === 'solar' || currentConfig.power === 'solar_plus');
    solarGroup.scale.x = currentConfig.power === 'solar_plus' ? 1.32 : 1.0;
    rtgGroup.visible = (currentConfig.power === 'rtg');

    dishGroup.visible = (currentConfig.comm === 'deep');
    uhfGroup.visible = (currentConfig.comm === 'uhf');
    shieldRing.visible = (currentConfig.shield === 'heavy');

    while (payloadGroup.children.length > 0) {
        payloadGroup.remove(payloadGroup.children[0]);
    }
    currentConfig.payloads.forEach((pKey, idx) => {
        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xc4b5fd, emissive: 0x4c1d95 })
        );
        const angle = (idx / currentConfig.payloads.length) * Math.PI * 2;
        orb.position.set(Math.cos(angle) * 0.65, 0.25, Math.sin(angle) * 0.65);
        payloadGroup.add(orb);
    });
}

function resetSpacecraftPosition() {
    isFlying = false;
    missionTime = 0;

    if (fullAssemblyGroup) {
        fullAssemblyGroup.position.set(0, 0, 0);
        fullAssemblyGroup.rotation.set(0.08, 0, 0);
        fullAssemblyGroup.scale.set(1, 1, 1);
    }
    if (spacecraftGroup) {
        spacecraftGroup.position.set(0, 1.35, 0);
        spacecraftGroup.rotation.set(0, 0, 0);
        spacecraftGroup.scale.set(1, 1, 1);
    }
    if (rocketStageGroup) {
        rocketStageGroup.visible = true;
        rocketStageGroup.position.set(0, -1.15, 0);
        rocketStageGroup.rotation.set(0, 0, 0);
    }
    if (planetGroup) {
        planetGroup.position.set(-5.2, 1.3, -9.0);
        planetGroup.scale.set(1, 1, 1);
    }
    if (mainFlameMesh) mainFlameMesh.visible = false;
    if (upperFlameMesh) upperFlameMesh.visible = false;
    if (scanLaserBeam) scanLaserBeam.visible = false;

    document.getElementById('flight-hud').classList.add('hidden');
    document.getElementById('launch-btn').disabled = false;
}

// ============================================================================
// 5. حلقة التحريك السينمائية (دوران الصاروخ + رحلة الإقلاع والهبوط والعودة)
// ============================================================================
function updateFlightHUD(phaseTitle, progressPercent, activeStepIndex) {
    document.getElementById('flight-phase-text').textContent = phaseTitle;
    document.getElementById('flight-progress-bar').style.width = `${progressPercent}%`;
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`step-${i}`);
        if (el) el.classList.toggle('active-step', i === activeStepIndex);
    }
}

function animate3D() {
    requestAnimationFrame(animate3D);

    if (planetMesh) {
        planetMesh.rotation.y += 0.003;
    }

    if (isFlying) {
        missionTime += 0.0016;
        const pct = Math.min(missionTime * 100, 100);

        starsMesh.position.z += 0.12;
        if (starsMesh.position.z > 25) starsMesh.position.z = 0;

        if (missionTime < 0.25) {
            const p = missionTime / 0.25;
            updateFlightHUD(`🚀 PHASE 1: ROCKET LIFTOFF & BOOSTER SEPARATION`, pct, 1);

            mainFlameMesh.visible = true;
            mainFlameMesh.scale.y = 0.9 + Math.sin(missionTime * 180) * 0.35;

            fullAssemblyGroup.position.y = THREE.MathUtils.lerp(0, 1.4, p);
            fullAssemblyGroup.position.x = Math.sin(missionTime * 220) * 0.04;
            fullAssemblyGroup.rotation.y += 0.04;

            if (p > 0.75) {
                const sep = (p - 0.75) / 0.25;
                rocketStageGroup.position.y = -1.15 - sep * 4.5;
                rocketStageGroup.rotation.z = sep * 0.5;
                mainFlameMesh.visible = false;
                upperFlameMesh.visible = true;
            }
        } else if (missionTime < 0.55) {
            const p = (missionTime - 0.25) / 0.30;
            const destName = DESTINATIONS[currentConfig.destination].name;
            updateFlightHUD(`🌌 PHASE 2: DEEP SPACE CRUISE TO ${destName}`, pct, 2);

            rocketStageGroup.visible = false;
            upperFlameMesh.visible = true;
            upperFlameMesh.scale.y = 0.8 + Math.sin(missionTime * 160) * 0.3;

            planetGroup.position.x = THREE.MathUtils.lerp(-5.2, 0, p);
            planetGroup.position.y = THREE.MathUtils.lerp(1.3, -2.4, p);
            planetGroup.position.z = THREE.MathUtils.lerp(-9.0, -1.5, p);

            fullAssemblyGroup.position.x = THREE.MathUtils.lerp(0, 0, p);
            fullAssemblyGroup.position.y = THREE.MathUtils.lerp(1.4, 0.9, p);
            fullAssemblyGroup.rotation.z = THREE.MathUtils.lerp(0, 0, p);
            fullAssemblyGroup.rotation.y += 0.05;
        } else if (missionTime < 0.80) {
            const p = (missionTime - 0.55) / 0.25;
            const destName = DESTINATIONS[currentConfig.destination].name;
            updateFlightHUD(`🛰️ PHASE 3: LANDED ON ${destName} // COLLECTING SCIENCE SAMPLES`, pct, 3);

            if (p < 0.35) {
                const landP = p / 0.35;
                fullAssemblyGroup.position.y = THREE.MathUtils.lerp(0.9, -0.35, landP);
                upperFlameMesh.visible = true;
            } else {
                fullAssemblyGroup.position.y = -0.35;
                upperFlameMesh.visible = false;
                scanLaserBeam.visible = true;
                scanLaserBeam.rotation.y += 0.08;
            }
        } else if (missionTime < 1.0) {
            const p = (missionTime - 0.80) / 0.20;
            updateFlightHUD(`🌍 PHASE 4: ASCENDING FROM SURFACE & RETURNING TO EARTH`, pct, 4);

            scanLaserBeam.visible = false;
            upperFlameMesh.visible = true;
            upperFlameMesh.scale.y = 1.1 + Math.sin(missionTime * 180) * 0.3;

            planetGroup.position.x = THREE.MathUtils.lerp(0, -5.2, p);
            planetGroup.position.y = THREE.MathUtils.lerp(-2.4, 1.3, p);
            planetGroup.position.z = THREE.MathUtils.lerp(-1.5, -9.0, p);

            fullAssemblyGroup.position.y = THREE.MathUtils.lerp(-0.35, 0.0, p);
            fullAssemblyGroup.rotation.y += 0.06;
        } else {
            isFlying = false;
            upperFlameMesh.visible = false;
            scanLaserBeam.visible = false;
            showFinalMissionModal();
        }
    } else if (!isDragging && fullAssemblyGroup) {
        fullAssemblyGroup.rotation.y += 0.0075;
    }

    renderer.render(scene, camera);
}

// ============================================================================
// 6. بدء رحلة الإقلاع والهبوط والعودة وإظهار النتيجة
// ============================================================================
function startLaunchSequence() {
    if (isFlying) return;

    lastMouseMoveTime = Date.now();
    isBotBored = false;
    clearBoredClasses();

    const data = calculateTelemetry();
    resetSpacecraftPosition();

    document.getElementById('flight-hud').classList.remove('hidden');
    document.getElementById('launch-btn').disabled = true;

    if (data.warnings.length === 0) {
        setRobotSpeech(`🚀 Liftoff! Watch our ${data.rocket.name} ignite, separate in orbit, land on ${data.dest.name} to scan samples, and fly back home!`);
    } else {
        setRobotSpeech(`⚠️ Launching with warnings! Let's watch the flight to ${data.dest.name} and see how the spacecraft handles the stress!`);
    }

    isFlying = true;
}

function showFinalMissionModal() {
    const data = calculateTelemetry();
    const modal = document.getElementById('result-modal');
    const card = document.getElementById('modal-card');
    const title = document.getElementById('modal-title');
    const score = document.getElementById('modal-score');
    const summary = document.getElementById('modal-summary');
    const log = document.getElementById('modal-log');

    modal.classList.remove('hidden');
    log.innerHTML = '';

    const isSuccess = data.warnings.length === 0;

    if (isSuccess) {
        const efficiencyBonus = Math.round(((BUDGET_CAP - data.totalCost) / BUDGET_CAP) * 20);
        const finalScore = Math.min(data.scienceScore + efficiencyBonus, 100);

        card.style.borderColor = 'var(--emerald)';
        score.style.borderColor = 'var(--emerald)';
        score.style.color = 'var(--emerald)';
        title.textContent = "🎉 FULL MISSION & RETURN SUCCESSFUL!";
        score.textContent = `${finalScore}%`;
        summary.textContent = `Congratulations Mission Architect Zainab! Your spacecraft launched on the ${data.rocket.name}, landed safely on ${data.dest.name}, collected surface data, and returned to Earth!`;

        log.innerHTML = `
            <li>✅ <strong>Budget Approved:</strong> $${data.totalCost}M utilized within $${BUDGET_CAP}M cap.</li>
            <li>✅ <strong>Launch & Landing Complete:</strong> Mass (${data.totalMass}kg) carried by ${data.rocket.name}.</li>
            <li>✅ <strong>Power Grid Stable:</strong> Generating ${data.powerSupply}W (Consuming ${data.powerDraw}W).</li>
            <li>✅ <strong>Total Science Return:</strong> ${data.scienceScore}% raw science + ${efficiencyBonus}% efficiency bonus!</li>
        `;
        setRobotSpeech(`🎉 WE DID IT ZAINAB! ${finalScore}% Mission Score! Safe landing and return from ${data.dest.name}!`);
    } else {
        card.style.borderColor = 'var(--danger)';
        score.style.borderColor = 'var(--danger)';
        score.style.color = 'var(--danger)';
        title.textContent = "⚠️ MISSION FAILED DURING OPERATIONS";
        score.textContent = "0%";
        summary.textContent = `Your spacecraft reached ${data.dest.name}, but critical engineering constraints caused mission failure:`;

        data.warnings.forEach(w => {
            log.innerHTML += `<li style="color:#fca5a5; margin-bottom:5px;">❌ ${w}</li>`;
        });
        setRobotSpeech(`😟 Mission failed due to: ${data.warnings[0]}. Click 'Modify Design' and let's fix it together!`);
    }
}

function closeModal() {
    document.getElementById('result-modal').classList.add('hidden');
    resetSpacecraftPosition();
}

window.addEventListener('DOMContentLoaded', () => {
    init3DScene();
    updateSystem();
    updateFloatingRobotLoop();
});