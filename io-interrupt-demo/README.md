# ⚡ I/O System & Interrupt Handling Demo

> **PBL 5 — Operating Systems**  
> A fully interactive, browser-based demo model that visualises how an OS handles I/O requests through interrupts and polling.

---

## 🖥️ Live Demo

Open `io-interrupt-demo/index.html` directly in any modern browser — no server or build step required.

---

## 📌 Problem Context

I/O devices interact with the CPU using device drivers, controllers, and interrupts. Understanding how an OS handles I/O requests is key for efficient system performance. This demo models that entire pipeline conceptually and with partial execution simulation.

---

## ✨ Features

### 🔄 Tab 1 — I/O Flow Animation
Step-by-step animated journey of an I/O request through all OS layers:

```
Application → System Call → Device Driver → Controller → I/O Device → IRQ
```

- Animated packet traversal along each layer
- Adjustable playback speed (0.5× – 3×)
- Per-step descriptions with technical details (trap instructions, port I/O, DMA, IRET)

### 🖥️ Tab 2 — Live I/O Simulation
Real-time simulation of **Interrupt-Driven** vs **Polling** I/O:

- Choose between Interrupt and Polling mode
- Select device: Hard Disk, Keyboard, Network Card, or Printer
- Live **CPU state panel** with register display (PC, IR, Mode)
- **Interrupt Vector Table** with triggered IRQ highlighting
- **System Bus** animation (Data / Address / Control lines)
- **Device progress bar** showing I/O completion
- **Colour-coded Event Log** with filters (All / Interrupts / Syscalls / CPU)
- Running stats: I/O Requests, Interrupts Fired, CPU Free %, Poll Cycles Wasted

### 📊 Tab 3 — Event Timeline
Gantt-style timeline of a complete I/O lifecycle:

| Track | Events |
|-------|--------|
| Application | read() call, wait, resume |
| Kernel/Syscall | syscall trap, IRET |
| Driver | init, command write |
| Controller | register access |
| IRQ Line | IRQ14 assertion |
| ISR | execution window |

### 📋 Tab 4 — Interrupt Handling Flowchart
Full SVG flowchart of the interrupt handling decision flow:

`Hardware Event → IRQ Assert → IF Flag Check → Context Save → IVT Lookup → ISR → EOI → IRET → Resume`

Includes side notes for PIC/APIC, kernel mode switch, and process wake-up via semaphore.

### ⚖️ Tab 5 — Polling vs Interrupt Comparison
- Detailed **comparison table** across 8 criteria (CPU utilisation, latency, complexity, scalability, power, etc.)
- **Animated CPU Gantt charts** for both modes
- **Bar chart** comparing CPU free time, throughput, and response latency

---

## 🗂️ Project Structure

```
io-interrupt-demo/
├── index.html   # Main layout with all 5 tabs
├── style.css    # Dark-mode design system, animations, charts
└── main.js      # Simulation engine, event logger, chart logic
```

---

## 🚀 How to Run

```bash
# Just open in browser:
open io-interrupt-demo/index.html
```

No dependencies. No build step. Works offline.

---

## 🧠 Concepts Demonstrated

| Concept | Where |
|---------|-------|
| System Call / Kernel Trap | Tab 1, Tab 2 |
| Device Driver & Controller | Tab 1, Tab 2 |
| IRQ / Interrupt Vector Table | Tab 2, Tab 4 |
| ISR (Interrupt Service Routine) | Tab 2, Tab 3, Tab 4 |
| Context Save & IRET | Tab 4 |
| DMA vs PIO | Tab 1 descriptions |
| Polling busy-wait | Tab 2, Tab 5 |
| CPU Utilisation trade-offs | Tab 5 |

---

## 📚 References

- Silberschatz, Galvin & Gagne — *Operating System Concepts* (10th ed.), Ch. 12–13
- Tanenbaum — *Modern Operating Systems* (4th ed.), Ch. 5
- Intel® 64 and IA-32 Architectures Software Developer's Manual, Vol. 3A — Interrupt Handling

---

*Built for PBL 5 — Operating Systems Course*
