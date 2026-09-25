# 粒子地球 · Interactive Particle Earth

基于 **Three.js** 构建的真实粒子地球视觉系统，通过 **MediaPipe 手势识别**驱动地球粒子实时变形，实现"零外链"的纯静态沉浸式交互体验。

## 特性

- 🌍 **真实地球**：使用 Natural Earth 1:10m 矢量数据（world-atlas TopoJSON），非贴图球体
- ✋ **手势驱动**：MediaPipe GestureRecognizer 识别手掌关键点，实时映射为地球形态
- 🎨 **实时形变**：Open_Palm（张开）/ Closed_Fist（握拳）/ Pointing_Up（上指）/ Thumb_Up / Thumb_Down / Victory / ILoveYou 七种手势
- 🚀 **高性能**：粒子 2048×1024 canvas，d3-geo 投影 + three.js r160 + UnrealBloom 辉光
- 📱 **移动端优化**：支持手势、触摸、鼠标多交互方式

## 在线体验

- 静态站点：https://sitong-zhang.github.io/homepage/

## 本地运行

```bash
python3 -m http.server 8000
```

> 需本地 HTTP 服务（`file://` 会被 CORS 拦截），访问 http://localhost:8000/ 即可。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 3D 渲染 | Three.js r160 + 自定义 GLSL 着色器 + OrbitControls + EffectComposer/UnrealBloomPass |
| 地理数据 | TopoJSON（Natural Earth 1:10m，3MB）+ d3-geo 投影 |
| 手势识别 | MediaPipe GestureRecognizer（浏览器端 bundle + task + wasm） |
| 粒子系统 | Canvas 粒子 + 地理坐标映射 + 颜色/高度形变 |
| PWA | Service Worker 离线缓存（CACHE = zjt-earth-v8） |

## 文件结构

```
index.html        主页（HTML + CSS + 手势模块 + 粒子系统）
sw.js             Service Worker：CACHE = zjt-earth-v8
README.md         项目文档
vendor/
  land-10m.json    Natural Earth 1:10m 地球 TopoJSON（3.0 MB）
  topojson-client.min.js   TopoJSON → GeoJSON
  d3-geo.min.js            投影实现（渲染/基础）
  d3-array.min.js          d3-geo 依赖
  three/                   three.js r160 + OrbitControls + 后处理特效
  mediapipe/               GestureRecognizer 浏览器端（bundle + task + wasm×2）
  gesture-icons/           Twemoji 手势 SVG（270b/270a/270c/1f44d/1f44e/261d/1f91f/1f590）
```

---

> 后续计划：支持更多手势形态、增加海洋流动粒子、多主题配色。