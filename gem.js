(() => {
  const canvas = document.getElementById("gemCanvas");
  const stage = document.getElementById("gemStage");
  if (!canvas || !stage) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let time = 0;
  let targetX = 0;
  let targetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let intensity = 1;

  const vertices = [
    [0.02, -1.34, -0.03],
    [-0.43, -0.78, 0.21],
    [0.04, -0.83, 0.48],
    [0.46, -0.68, 0.18],
    [0.52, -0.67, -0.29],
    [0.03, -0.76, -0.5],
    [-0.47, -0.69, -0.27],
    [-0.66, -0.06, 0.14],
    [-0.17, -0.04, 0.65],
    [0.51, 0.01, 0.42],
    [0.69, 0.03, -0.13],
    [0.25, -0.02, -0.62],
    [-0.43, 0.02, -0.56],
    [-0.5, 0.68, 0.12],
    [-0.08, 0.78, 0.48],
    [0.45, 0.64, 0.25],
    [0.48, 0.63, -0.26],
    [0.03, 0.74, -0.5],
    [-0.44, 0.64, -0.31],
    [-0.02, 1.29, 0.02]
  ];

  const faces = [
    [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 6], [0, 6, 1],
    [1, 7, 8, 2], [2, 8, 9, 3], [3, 9, 10, 4], [4, 10, 11, 5], [5, 11, 12, 6], [6, 12, 7, 1],
    [7, 13, 14, 8], [8, 14, 15, 9], [9, 15, 16, 10], [10, 16, 17, 11], [11, 17, 18, 12], [12, 18, 13, 7],
    [13, 19, 14], [14, 19, 15], [15, 19, 16], [16, 19, 17], [17, 19, 18], [18, 19, 13]
  ];

  const crackEdges = [[1, 8], [8, 15], [15, 19], [3, 9], [9, 14], [5, 11], [11, 17], [7, 14]];
  const dust = Array.from({ length: 26 }, (_, i) => ({
    a: Math.random() * Math.PI * 2,
    r: .62 + Math.random() * .55,
    y: -.75 + Math.random() * 1.5,
    s: .35 + Math.random() * .85,
    p: Math.random() * Math.PI * 2,
    pink: i % 11 === 0
  }));

  const normalize = v => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  const rotate = (v, rx, ry, rz) => {
    let [x, y, z] = v;
    let c = Math.cos(rx), s = Math.sin(rx);
    [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ry); s = Math.sin(ry);
    [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(rz); s = Math.sin(rz);
    [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  };

  const project = v => {
    const fov = 3.9;
    const scale = Math.min(width, height) * .33;
    const d = fov / (fov - v[2]);
    return [width * .5 + v[0] * scale * d, height * .5 + v[1] * scale * d, v[2], d];
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawGlow = (cx, cy, scale) => {
    const radius = Math.min(width, height) * .37 * scale;
    const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    bloom.addColorStop(0, `rgba(165,245,255,${.24 * intensity})`);
    bloom.addColorStop(.26, `rgba(72,205,255,${.14 * intensity})`);
    bloom.addColorStop(.58, `rgba(33,130,210,${.055 * intensity})`);
    bloom.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawDust = (rx, ry, rz) => {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    dust.forEach((p, i) => {
      const a = p.a + time * (.08 + i * .0007);
      const v = [Math.cos(a) * p.r, p.y + Math.sin(time * .6 + p.p) * .08, Math.sin(a) * p.r];
      const r = rotate(v, rx * .45, ry * .35, rz);
      const q = project(r);
      const alpha = clamp((r[2] + 1.3) / 2.6, .12, .8) * .62;
      ctx.fillStyle = p.pink ? `rgba(255,104,166,${alpha * .42})` : `rgba(190,247,255,${alpha})`;
      ctx.shadowColor = p.pink ? "#ff5b9f" : "#62dcff";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(q[0], q[1], p.s * q[3], 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    const drift = reducedMotion ? 0 : Math.sin(time * .72) * .035;
    const rx = -.16 + pointerY * .42 + drift;
    const ry = time * (reducedMotion ? 0 : .18) + pointerX * .7;
    const rz = .055 + Math.sin(time * .33) * .025;

    const transformed = vertices.map(v => rotate(v, rx, ry, rz));
    const projected = transformed.map(project);
    const center = project(rotate([0, .02, 0], rx, ry, rz));

    drawGlow(center[0], center[1], 1);
    drawDust(rx, ry, rz);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const core = ctx.createRadialGradient(center[0] - 16, center[1] - 22, 2, center[0], center[1], Math.min(width, height) * .19);
    core.addColorStop(0, `rgba(255,255,255,${.72 * intensity})`);
    core.addColorStop(.16, `rgba(184,246,255,${.34 * intensity})`);
    core.addColorStop(.48, `rgba(54,207,255,${.16 * intensity})`);
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(center[0], center[1], Math.min(width, height) * .18, Math.min(width, height) * .25, -.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const light = normalize([-.55 + pointerX * .45, -.75 + pointerY * .25, 1.5]);
    const view = [0, 0, 1];

    const faceData = faces.map((face, index) => {
      const a = transformed[face[0]];
      const b = transformed[face[1]];
      const c = transformed[face[2]];
      let normal = normalize(cross(sub(b, a), sub(c, a)));
      const avgZ = face.reduce((sum, vi) => sum + transformed[vi][2], 0) / face.length;
      const facing = dot(normal, view);
      if (facing < 0) normal = normal.map(v => -v);
      return { face, index, normal, avgZ, facing: Math.abs(facing) };
    }).sort((a, b) => a.avgZ - b.avgZ);

    faceData.forEach(data => {
      const pts = data.face.map(i => projected[i]);
      const n = data.normal;
      const diffuse = clamp(dot(n, light) * .5 + .5, 0, 1);
      const facing = clamp(data.facing, 0, 1);
      const rim = Math.pow(1 - facing, 2.1);
      const reflected = normalize([2 * dot(n, light) * n[0] - light[0], 2 * dot(n, light) * n[1] - light[1], 2 * dot(n, light) * n[2] - light[2]]);
      const spec = Math.pow(clamp(dot(reflected, view), 0, 1), 17);

      const shadow = [8, 46, 82];
      const cyan = [31, 172, 224];
      const pale = [196, 244, 255];
      const white = [255, 255, 255];
      let color = mix(shadow, cyan, .38 + diffuse * .48);
      color = mix(color, pale, rim * .45);
      color = mix(color, white, spec * .8);
      if (data.index % 7 === 2) color = mix(color, [93, 210, 244], .16);
      if (data.index % 11 === 4) color = mix(color, [145, 213, 245], .1);

      const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const gx = cx + n[0] * 90;
      const gy = cy + n[1] * 90;
      const grad = ctx.createLinearGradient(cx - n[0] * 70, cy - n[1] * 70, gx, gy);
      const c1 = mix(color, white, .16 + spec * .3);
      const c2 = mix(color, shadow, .22);
      const alpha = .57 + facing * .2;
      grad.addColorStop(0, `rgba(${c1.map(Math.round).join(",")},${alpha})`);
      grad.addColorStop(.55, `rgba(${color.map(Math.round).join(",")},${alpha * .93})`);
      grad.addColorStop(1, `rgba(${c2.map(Math.round).join(",")},${alpha * .86})`);

      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = `rgba(207,248,255,${.09 + facing * .11 + spec * .28})`;
      ctx.lineWidth = .8 + spec * .8;
      ctx.stroke();
    });

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    crackEdges.forEach((edge, i) => {
      const a = projected[edge[0]];
      const b = projected[edge[1]];
      const pulse = .34 + Math.sin(time * 1.5 + i * .8) * .12;
      ctx.strokeStyle = `rgba(223,252,255,${pulse * intensity})`;
      ctx.shadowColor = "rgba(98,220,255,.7)";
      ctx.shadowBlur = 6;
      ctx.lineWidth = .7;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo((a[0] + b[0]) * .5 + Math.sin(i * 2.1) * 7, (a[1] + b[1]) * .5 + Math.cos(i * 1.6) * 5);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    });
    ctx.restore();

    const top = projected[0];
    const side = projected[3];
    const highlight = ctx.createLinearGradient(top[0], top[1], side[0], side[1]);
    highlight.addColorStop(0, "rgba(255,255,255,.78)");
    highlight.addColorStop(.45, "rgba(205,249,255,.16)");
    highlight.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = highlight;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(top[0], top[1]);
    ctx.lineTo(projected[2][0], projected[2][1]);
    ctx.lineTo(side[0], side[1]);
    ctx.stroke();

    time += reducedMotion ? 0 : .016;
    requestAnimationFrame(draw);
  };

  window.setGemIntensity = active => {
    intensity = active ? 1.32 : 1;
  };

  window.addEventListener("pointermove", event => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width, 1);
    const y = (event.clientY - (rect.top + rect.height / 2)) / Math.max(rect.height, 1);
    targetX = clamp(x, -.7, .7);
    targetY = clamp(y, -.7, .7);
  }, { passive: true });

  document.documentElement.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
  });

  const easePointer = () => {
    pointerX += (targetX - pointerX) * .045;
    pointerY += (targetY - pointerY) * .045;
    requestAnimationFrame(easePointer);
  };

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(easePointer);
  requestAnimationFrame(draw);
})();
