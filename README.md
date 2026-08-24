# 🍫 NutriScan AI — Smart FSSAI Label Scanner & Nutri-Score Calculator

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenCV-4.8+-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" />
</p>

---

## 💡 The Big Idea: Unmasking Hidden Packaging Labels in India

In European countries, food wrappers prominently feature front-of-pack **Nutri-Score** ratings (Grade A to E), allowing buyers to spot unhealthy foods in seconds. 

In India, however, mass-market chocolates and packaged snacks conceal extreme sugar levels (often **over 55% of total weight!**) and palm oil inside microscopic back-of-pack FSSAI tables. Most consumers take a bite without realizing they are consuming 14+ teaspoons of sugar in a single sitting.

**NutriScan AI** solves this information blackout. Before taking a bite of chocolate or a snack, users open NutriScan AI on their mobile camera, snap a photo of the back label, and instantly receive:
1. An official **Nutri-Score Grade (A to E)**.
2. A direct **Pre-Eating Decision Report** (🟢 **SAFE TO EAT**, 🟡 **EAT IN MODERATION**, 🔴 **HIGH RISK**).
3. A transparent breakdown of sugars, saturated fats, and harmful emulsifiers (`INS 476 / PGPR`).

---

## 🚀 Key Features

* 📷 **Live Camera Viewfinder Modal**: Point phone camera directly at chocolate wrappers or nutrition tables, align inside interactive bounding box guides, and capture instant snapshots.
* 🛑 **Pre-Eating Decision Report Card**: Instant verdict before you bite:
  * 🟢 **GREEN LIGHT: SAFE TO EAT** (Grades A & B — rich in cocoa/fiber, low sugar).
  * 🟡 **YELLOW LIGHT: EAT IN MODERATION** (Grades C & D — limit portion to 1-2 small squares / 15g).
  * 🔴 **RED LIGHT: HIGH HEALTH RISK** (Grade E — high sugar overload, palm oil, artificial emulsifiers).
* 🧮 **2023 Nutri-Score Algorithm Engine**: Computes deterministic negative points (calories, sugars, sat fat, sodium) vs. positive points (protein, fiber, cocoa %) with European protein capping rules.
* 👁️ **Computer Vision & FSSAI OCR Parser**: OpenCV preprocessing (grayscale, adaptive thresholding) + PyTesseract OCR regex parsing tailored for Indian FSSAI labels.
* 🧪 **Emulsifier & Additive Audit**: Detects ultra-processed additives such as Polyglycerol Polyricinoleate (`INS 476`) and Soy Lecithin (`INS 322`).
* 🍫 **Indian Brand Benchmarks & Barcode Scanner**: Pre-loaded profiles for *Cadbury Dairy Milk*, *Amul 75% Dark Chocolate*, *KitKat*, *Munch*, plus instant barcode lookup.
* 📝 **FSSAI 100g Verification Form**: Interactive form allowing users to tweak nutrition numbers and recalculate scores live.

---

## 🛠️ Technology Stack & Tags Used

### Backend Architecture
* **`Python 3.13`**: Core backend programming language.
* **`FastAPI`**: High-performance asynchronous REST API framework.
* **`Uvicorn`**: Lightning-fast ASGI web server.
* **`OpenCV (opencv-python-headless)`**: Computer vision image enhancement (contrast adjustment, noise removal).
* **`PyTesseract`**: Optical Character Recognition engine for reading packaging text.
* **`Pydantic`**: Strict data validation & schema serialization.
* **`Pytest`**: Automated backend test suite.

### Frontend Architecture
* **`Next.js 14 (App Router)`**: Modern React framework for SSR and client navigation.
* **`React 18`**: Component-driven UI development.
* **`TypeScript`**: Type-safe frontend application state management.
* **`Tailwind CSS`**: Utility-first CSS styling with custom dark theme (`#080c14`) & glassmorphism (`glass-card`).
* **`Lucide React`**: Modern minimalist icon set.

---

## 📦 How to Clone and Run Locally

Follow these steps to clone and run the full-stack application on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/NutriScan-AI.git
cd NutriScan-AI
```

### 2. Run Backend (FastAPI Server)
```bash
# Navigate to backend directory
cd backend

# Install required Python packages
pip install -r requirements.txt

# Run automated tests (optional)
python -m pytest

# Start FastAPI server on port 8000
python -m uvicorn main:app --reload --port 8000
```
> Backend API will be live at: `http://localhost:8000`  
> Interactive Swagger API docs: `http://localhost:8000/docs`

### 3. Run Frontend (Next.js App)
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install NPM dependencies
npm install

# Start Next.js development server
npm run dev
```
> Web application will be live at: `http://localhost:3000`

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/ocr` | Uploads wrapper photo, pre-processes with OpenCV, parses FSSAI text |
| `POST` | `/api/calculate` | Computes Nutri-Score grade, point breakdown, and recommendations |
| `GET` | `/api/barcode/{code}` | Fetches nutritional specs by product barcode |
| `GET` | `/api/benchmarks` | Returns pre-configured Indian brand benchmark products |

---

## 🤝 Contributing & Feedback

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a pull request.

⭐ **If you find this project useful, give it a star on GitHub!**
