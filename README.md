# 🏙️ Home Zone Analyzer

**Home Zone Analyzer** is a web application that helps users explore and evaluate different urban areas based on open geographic data (GeoJSON) and predefined criteria such as the presence of green areas, cultural spots, public transport, Wi-Fi, and more.

It combines a Node.js backend, a dynamic frontend, and a PostgreSQL + PostGIS database—all containerized and ready to deploy using Docker and Kubernetes.

---

## 📌 Key Features

- Visualize data layers like green spaces, hospitals, theaters, Wi-Fi zones, bus stops, etc.
- Analyze city zones interactively based on customizable filters
- Load and serve GeoJSON data dynamically from the backend
- Use PostgreSQL with PostGIS for geographic data queries
- Fully containerized with Docker and Kubernetes support

---

## ⚙️ Technologies Used

- **Node.js** / Express.js
- **PostgreSQL** + **PostGIS**
- **Docker**, **Docker Compose**
- **Kubernetes** (with example `deployment.yaml` and `ingress.yaml`)
- **GeoJSON** spatial datasets
- **Frontend**: (insert here: Angular? React? Vite?)

---

## 🌍 Data Layers

The app uses open datasets in GeoJSON format for the city of **Bologna**, including:

- Green areas (`aree_verdi.geojson`)
- Museums, libraries, cinemas, theaters
- Hospitals and sports centers
- Bus stops and train stations
- Public Wi-Fi spots
- City districts (`quartieri_bologna.geojson`)
- Public events

---

## 🚀 Getting Started (Local)

1. **Clone the repo**  
```bash
git clone https://github.com/JackSagliano/Home-Zone-Analyzer.git
cd Home-Zone-Analyzer
```
2. **Install the dependencies**
```bash
cd backend
npm install
```
4. **Start with Docker Compose**
```bash
docker-compose up --build
```

4. **Access the app via**
```bash
http://localhost:30080
```
