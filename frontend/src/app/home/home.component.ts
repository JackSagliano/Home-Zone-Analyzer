import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Icon, Style, Fill, Stroke, Text } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import { MapService } from '../map.service';
import { defaults as defaultControls } from 'ol/control';
import GeoJSON from 'ol/format/GeoJSON';
import { QuestionarioService } from '../questionario.service';
import { Geometry } from 'ol/geom';
import { Router } from '@angular/router';
import { defaults as defaultInteractions } from 'ol/interaction';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private map!: Map;
  private vectorSource!: VectorSource;
  private drawSource!: VectorSource;
  private drawInteraction!: Draw;
  public questionarioData: any[] = []; 
  private selectedFilters: { [key: string]: boolean } = {};
  private mode: 'none' | 'marker' | 'polygon' |'removeGeometry' = 'none'; 
  public lista_aree_candidate: {area_di_base:Feature, area_vicinato:Feature,pois_esterni:Feature[],pois_interni:Feature[], raggio_vicinato: number, rank: number}[] = [];
  private layers: any = {};
  private raggio_vicinato: number = 300; 
  public lista_immobili_candidati: { nome: string, marker: Feature, circle: Feature, pois: Feature[], coordinates: [number, number], raggio_vicinato:number, prezzo: number, isEditing: boolean, quartiere: string, rank: number }[] = []; 
  public selectedImmobile: any = null;
  public selectedQuartiere: any = null;
  public quartieri: { nome: string; prezzo_medio: number }[] = [
    { nome: 'Borgo Panigale', prezzo_medio: 0 },
    { nome: 'Navile', prezzo_medio: 0 },
    { nome: 'San Donato-San Vitale', prezzo_medio: 0 },
    { nome: 'Santo Stefano', prezzo_medio: 0 },
    { nome: 'Porto-Saragozza', prezzo_medio: 0 },
    { nome: 'Savena', prezzo_medio: 0 }
  ];
  public quartieri_layer!: VectorLayer<Feature<Geometry>>;
  public moranPanelOpen: boolean = false;
  public moranInterpretation: string = '';
  public poiDensityInterpretation: string = '';
  public moranPrezziValue: any = -9999;
  public moranPoiValue: any = -9999;
  private isAreaRequestInProgress = false;
  private miglioriImmobili: any ;
  private best_rank: any;
  public mapLoaded: boolean = false;
  public menu_visibile: boolean = false;
  public miglioriPosizioni_visibili: boolean = false;
  private miglioriPosizioni_features: Feature[] = []; 
  private numero_immobili: number = 1; 
 

  constructor(private mapservice: MapService, private questionarioService: QuestionarioService, private router: Router) { }
  
/************************************************** CODICE RELATIVO ALL'INIZIALIZZAZIONE DEL COMPONENTE + FUNZIONI GENERALI*************************************************/
  ngOnInit() {
    this.vectorSource = new VectorSource();
    this.drawSource = new VectorSource();
    this.loadQuestionarioData();
    this.initMap();
    // Disabilita le interazioni della mappa
    this.map.getInteractions().clear();
    const username = localStorage.getItem('username');
    // Mostra il popup di caricamento
    document.getElementById('loading-popup')!.style.display = 'block';
    // Ottieni le migliori posizioni e rendi la mappa interagibile solo dopo
    this.ottieniMiglioriPosizioni().then(() => {
      // Abilita le interazioni della mappa
      const interactions = defaultInteractions().getArray();
      interactions.forEach(interaction => this.map.addInteraction(interaction));
      this.mapLoaded = true;
      // Nascondi il popup di caricamento
      document.getElementById('loading-popup')!.style.display = 'none';      
    });
        
  }


  //funzione che inserisce nel localStorage tutte le domande del questionario con i relativi valori
  loadQuestionarioData() {
    this.questionarioData = this.questionarioService.getQuestionarioData();
    if (!this.questionarioData) {
      const storedData = localStorage.getItem('questionarioData');
      if (storedData) {
        this.questionarioData = JSON.parse(storedData);
        this.questionarioService.setQuestionarioData(this.questionarioData); 
      }
    }

    if (this.questionarioData) {    
      this.questionarioData.forEach((question: any) => {
        this.selectedFilters[question.tipo] = false;
      });
    } else {
      console.log("No questionario data available.");
    }
  }

  mostraMenuLaterale() {
    if(this.menu_visibile == false){
    this.menu_visibile = true;
    } else {
      this.menu_visibile = false;
    }
   
  }

  // Funzione per ottenere il colore in base al rank
  getColorByRank(rank: number) {
    const intervallo = this.best_rank / 4;
    if (rank <= intervallo) {
      return 'red'; // Zone scarse
    } else if (rank <= intervallo * 2) {
      return 'orange'; // Zone sufficienti
    } else if (rank <= intervallo * 3) {
      return 'yellow'; // Zone buone
    } else {
      return 'green'; // Zone ottime
    }
  }

  async showMoranPanel(quartiere: any) {
    const moranIndex = await this.IndiceMoranIPrezzo(quartiere);
    this.moranPrezziValue = moranIndex;
    const densityIndex = await this.indiceMoranINumeroPoi(quartiere);
    this.moranPoiValue = densityIndex;
    if(isNaN(this.moranPrezziValue) && isNaN(this.moranPoiValue)){
      this.moranInterpretation = `Informazioni relative a ${quartiere.nome} non disponibili. Scegli almeno sei immobili in diverse parti del quartiere. Per scoprire anche le informazioni
      relative al prezzo degli immobili, inserisci anche il prezzo medio per gli immobili di questo quartiere, tramite l'apposita icona vicino al nome del quartiere.`;
      this.poiDensityInterpretation = '';
    } 
    else {
    if (isNaN(this.moranPrezziValue)) {
      this.moranPrezziValue = -9999;
    } else if (this.moranPrezziValue > 0.3) {
      this.moranInterpretation = `All\' interno del quartiere ${quartiere.nome} immobili vicini hanno prezzi molto simili.`;
    } else if (this.moranPrezziValue < -0.3) {
      this.moranInterpretation = `All\' interno del quartiere ${quartiere.nome} immobili vicini hanno prezzi molto diversi.`;
    } else {
      this.moranInterpretation = `All\' interno del quartiere ${quartiere.nome} non c'è alcun tipo di correlazione spaziale con i prezzi degli immobili.`;
    }
    if (isNaN(this.moranPoiValue)) {
      this.moranPoiValue = -9999;
    } else if (this.moranPoiValue > 0.3) {
      if(this.moranPrezziValue == -9999){
        this.poiDensityInterpretation = `All\' interno del quartiere ${quartiere.nome} immobili vicini hanno un numero di punti di interesse molto simile.`;
      } else {
        this.poiDensityInterpretation = 'Immobili vicini hanno un numero di punti di interesse molto simile.';
      }
    } else if(this.moranPoiValue < - 0.3){
      if(this.moranPrezziValue == -9999){
        this.poiDensityInterpretation = `All\' interno del quartiere ${quartiere.nome} immobili vicini hanno un numero di punti di interesse molto diverso.`;
      } 
      else {
        this.poiDensityInterpretation = 'Immobili vicini hanno un numero di punti di interesse molto diverso.';
      }
      } 
      else {
        if(this.moranPrezziValue == -9999){
          this.poiDensityInterpretation = `All\' interno del quartiere ${quartiere.nome} non c'è alcun tipo di correlazione spaziale con il numero di punti di interesse.`;
        } 
        else {
          this.poiDensityInterpretation = 'non c\'è alcun tipo di correlazione spaziale con il numero di punti di interesse.';
        }
      }
    }
  }

  ottieniMiglioriPosizioni(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mapservice.suggerisciPosizioni(this.questionarioData, this.raggio_vicinato).subscribe(response => {
        this.miglioriImmobili = response.miglioriPosizioni;
        if (this.miglioriImmobili && this.miglioriImmobili.length > 0) {
          this.best_rank = this.miglioriImmobili[0].rank; // Imposta il best_rank con il valore più alto
        }
          resolve();
      }, error => {
        console.error('Errore durante il suggerimento delle posizioni:', error);
        reject(error);
      });
    });
  }

  chiudiMoranPanel() {
    this.moranPrezziValue = -9999;
    this.moranPoiValue = -9999;
  }

  mostraMiglioriPosizioni() {
    if(this.miglioriPosizioni_visibili == false){
      this.miglioriImmobili.forEach((posizione:any) => {
        const pointFeature = new Feature({
        geometry: new Point(fromLonLat(posizione.punto))
        });
        pointFeature.setStyle(new Style({
        image: new Icon({
          src: `assets/star.png`,
          anchor: [0.5, 1],
          scale: 0.35
        })
        }));
        this.vectorSource.addFeature(pointFeature);
        this.miglioriPosizioni_features.push(pointFeature);
      });
      this.miglioriPosizioni_visibili = true;
    } 
    else {
      // Rimuovi le migliori posizioni
      this.miglioriPosizioni_features.forEach(feature => this.vectorSource.removeFeature(feature));
      this.miglioriPosizioni_features = [];
      this.miglioriPosizioni_visibili = false;
    } 
  }

  logOut(){
    localStorage.clear();
    this.router.navigate(['/accedi'])
  }

  removeLayer(map: Map, type: string): void {
    if (this.layers[type]) {
      map.removeLayer(this.layers[type]);
    }
  }

  inserisciPrezzoMedio(quartiere: any){
    this.selectedQuartiere = quartiere;
    document.getElementById('prezzoMedioModal')!.style.display = 'block';
  }
    
  chiudiDialogPrezzoMedio() {
    document.getElementById('prezzoMedioModal')!.style.display = 'none';
  }

  modificaPrezzoMedio() {
    const priceInput = <HTMLInputElement>document.getElementById('prezzoMedioInput');
    const newPrice = priceInput.value;
    console.log(newPrice)
    for(let i=0; i < this.quartieri.length; i++){
      if(this.selectedQuartiere.nome == this.quartieri[i].nome){
        if (Number(newPrice) !=null || Number(newPrice) !=0) {
          this.quartieri[i].prezzo_medio = Number(priceInput.value);
        }
      }
    }
    this.chiudiDialogPrezzoMedio()
  }
/************************************************** CODICE RELATIVO ALLA MAPPA *************************************************/
  initMap() {
    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM({ //Utilizzo OpenStreetMap come Map Tile Provider
            attributions: []
          })
        }),
        new VectorLayer({
          source: this.vectorSource
        }), 
        new VectorLayer({
          source: new VectorSource({
            url: `assets/confini_bologna.json`,
            format: new GeoJSON()
          }),
          style: new Style({
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0)'
            }),
            stroke: new Stroke({
              color: '#000000',
              width: 1
            })
          })
        }),
        this.quartieri_layer = new VectorLayer({
          source: new VectorSource({
            url: `assets/quartieri_bologna.geojson`,
            format: new GeoJSON()
          }),
          style:  new Style({
            fill: new Fill({
            color: 'rgba(255,255,255, 0.1)'
            }),
          stroke: new Stroke({
            color: '#000000',
            width: 2
            })
          })
        })
      ],
      view: new View({
        center: fromLonLat([11.3426, 44.4949]),
        zoom: 12
      }),
      controls: defaultControls({ zoom: true })
    });
    this.map.on('click', (event) => {
      if (this.mode === 'marker') {
        const coordinate = toLonLat(event.coordinate);
        const [longitude, latitude] = coordinate;
        console.log("IMMOBILE AGGIUNTO CON LE COORDINATE: "+ longitude + ','+ latitude)
        this.aggiungiImmobileDB([longitude, latitude]);
        //Rimuove marker quando ci clicco
      } else if (this.mode === 'removeGeometry') {
        this.map.forEachFeatureAtPixel(event.pixel, (featureLike) => {
          const feature = featureLike as Feature;
          if (feature.get('type') === 'marker') {
            this.vectorSource.removeFeature(feature);
            const markerDaRimuovere = this.lista_immobili_candidati.find(data => data.marker === feature);
            if (markerDaRimuovere) {
              this.vectorSource.removeFeature(markerDaRimuovere.circle);   
              markerDaRimuovere.pois.forEach(poi => this.vectorSource.removeFeature(poi));
              this.lista_immobili_candidati = this.lista_immobili_candidati.filter(data => data.marker !== feature); 
            }
          } 
          else if (feature.get('type') === 'polygon') {
            this.drawSource.removeFeature(feature); 
            this.vectorSource.removeFeature(feature);
            const areaDaRimuovere = this.lista_aree_candidate.find(data => data.area_di_base === feature);
            if (areaDaRimuovere) {   
              areaDaRimuovere.pois_esterni.forEach(poi => this.vectorSource.removeFeature(poi));
              areaDaRimuovere.pois_interni.forEach(poi => this.vectorSource.removeFeature(poi));
              this.drawSource.removeFeature(areaDaRimuovere.area_vicinato)
              this.vectorSource.removeFeature(areaDaRimuovere.area_vicinato)
              this.lista_aree_candidate = this.lista_aree_candidate.filter(data => data.area_di_base !== feature);
            }
          }
        });
      }
    });
  }

  enableMarkerMode() {
    if(this.mode == 'marker'){
      this.mode = 'none'
    } 
    else {
      this.mode = 'marker';
      //se c'era qualche vecchia interazione con la mappa, viene annullata (le uniche iterazioni che possono essere in sospeso sono quelle relative
      //all'aggiunta di un poligono)
      if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
      }
    }
  }

  enablePolygonMode() {
    if(this.mode == 'polygon'){
      this.mode = 'none'
      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
      }
    } 
    else {
      this.mode = 'polygon';
      //se c'era qualche vecchia interazione con la mappa, viene annullata
      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
      }
      this.aggiungiAreaDB();
    }
  }
 
  
  //funzione che viene richiamata quando clicchiamo sul bottone laterale "rimuovi immobile/area"
  enableRemoveMarkerMode() {
    if (this.mode === 'removeGeometry') {
      this.mode = 'none';
    } else {
      this.mode = 'removeGeometry';
      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
      }
    }
  }
  

  //funzione che cattura quale checkbox viene cliccato nel pannello dei filtri
  onFilterChange(event: any, tipo: string): void {
    this.selectedFilters[tipo] = event.target.checked;
    this.setLayerVisibility(tipo, event.target.checked);
  }

  
  setLayerVisibility(layerName: string, isVisible: boolean) {
    
    //tutti gli spazi presenti nei tipi del questionario vengono rimpiazzati col trattino in basso
    const sanitizedLayerName = layerName.replace(/\s+/g, '_');
    const sanitizedLayerNameIcon = sanitizedLayerName + '_icon'

    if (isVisible) {
      if (this.layers[sanitizedLayerName]) {
        this.layers[sanitizedLayerName].setVisible(true);
        this.map.addLayer(this.layers[sanitizedLayerName]);
      } else {
        const layer = new VectorLayer({
          source: new VectorSource({
            url: `assets/PoI/${sanitizedLayerName}.geojson`,
            format: new GeoJSON()
          }),
          style: new Style({
            image: new Icon({
              scale: 0.05,
              src: `assets/PoI/${sanitizedLayerNameIcon}.png`
            })
          })
        });
        this.layers[sanitizedLayerName] = layer;
        this.map.addLayer(layer);
      }
    } else {
      if (this.layers[sanitizedLayerName]) {
        this.layers[sanitizedLayerName].setVisible(false);
        this.map.removeLayer(this.layers[sanitizedLayerName]);
      }
    }
  }
  
/************************************************** CODICE RELATIVO AI QUARTIERI E AGLI IMMOBILI *************************************************/

  coloraQuartiere(quartiere: string) {
    const features = this.quartieri_layer.getSource();
    if (features) {
      const quartiereFeature = features.getFeatures().find(feature => feature.get('name') === quartiere);
      if(quartiereFeature){
        if(quartiereFeature.getStyle() == null){
          quartiereFeature.setStyle(new Style({
          fill: new Fill({
            color: this.getColorByQuartiere(quartiere)
          }),
          stroke: new Stroke({
            color: '#000000',
            width: 2
          })
          }));
        } 
        else {  
          quartiereFeature.setStyle();
        } 
      }
    } 
    else {
      console.error("La sorgente del layer è null");
    }
  }


  hasImmobiliInQuartiere(quartiere: string): boolean {
    return this.lista_immobili_candidati.some(immobile => immobile.quartiere === quartiere);
  }

  getColorByQuartiere(name: string){
    switch (name) {
      case 'Borgo Panigale':
        return 'rgba(255, 0, 0,0.3)'; // Rosso
      case 'Navile':
        return 'rgba(0, 128, 0,0.3)'; // Verde
      case 'San Donato-San Vitale':
        return 'rgba(0, 0, 255,0.3)'; // Blu
      case 'Santo Stefano':
        return 'rgba(128,0,128,0.3)'; // Giallo
      case 'Porto-Saragozza':
        return 'rgba(255, 255, 0, 0.3)';
      case 'Savena':
        return 'rgba(0, 255, 255,0.3)'; 
      default:
        return 'rgba(255,255,255,0.1)';
    }
  }
  aggiungiImmobileDB(coordinates: [number, number]) {
    const markerGeom = {
      type: 'Point',
      coordinates: coordinates
    };
    const username = localStorage.getItem('username');
    this.mapservice.aggiungiImmobileDB(markerGeom, username!.toString(), this.raggio_vicinato, this.questionarioData).subscribe(response1 => {         
      const markerFeature = new GeoJSON().readFeature({
        type: 'Feature',
        geometry: JSON.parse(response1.pointGeom)
      }, 
      {
        featureProjection: 'EPSG:3857'
      });
      const circleGeomObject = JSON.parse(response1.circleGeom);
      const circleCoordinates = circleGeomObject.coordinates;
      const circleType = circleGeomObject.type;  
      const geometryFeature = {
        type: circleType,
        coordinates: circleCoordinates
      };   
      const circleFeature = new GeoJSON().readFeature({
        type: 'Feature',
        geometry: geometryFeature
      }, 
      {
        featureProjection: 'EPSG:3857'
      });   
      const color = this.getColorByRank(response1.rank)
      markerFeature.setStyle(new Style({
        image: new Icon({
          src: `assets/PoI/marker-${color}.png`,
          anchor: [0.5, 1],
          scale: 0.12
        }),
        text: new Text({
          text: `Immobile ${this.numero_immobili}`,
          offsetY: -25,
          font: 'bold 12px Arial, sans-serif', 
          fill: new Fill({
            color: '#000000'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      }));
      circleFeature.setStyle(new Style({
        stroke: new Stroke({
          color: color,
          width: 2,
          lineDash: [10, 10]
        })
      }));
      circleFeature.set('type', 'circle');   
      markerFeature.set('type', 'marker');
      this.vectorSource.addFeature(markerFeature);
      this.vectorSource.addFeature(circleFeature);
      const poiFeatures = response1.pois.map((poi: any) => {  
        const poiCoordinates = fromLonLat([poi.lon, poi.lat]);
        const poiMarker = new Feature({
          geometry: new Point(poiCoordinates)
        });
        poiMarker.set('type', 'poi');
        poiMarker.setStyle(new Style({
          image: new Icon({
            src: `assets/PoI/${poi.type}_icon.png`,
            scale: 0.05
          })
        }));
        this.vectorSource.addFeature(poiMarker);
          return poiMarker;
      });
      this.mapservice.getQuartiere(coordinates).subscribe(
        response2 =>{
          const nome_quartiere = String(response2)
          this.lista_immobili_candidati.push({
            nome: `Immobile ${this.numero_immobili}`,
            marker: markerFeature,
            circle: circleFeature,
            pois: poiFeatures,
            coordinates: coordinates,
            raggio_vicinato: this.raggio_vicinato,
            prezzo: 0,
            isEditing: false,
            quartiere: nome_quartiere,
            rank: response1.rank
          });
          this.numero_immobili = this.numero_immobili +1
          this.indiceMoranINumeroPoi(nome_quartiere)
        }
      )     
      console.log(this.lista_immobili_candidati)
    }, 
    error => {
      console.error('Errore durante l\'aggiunta dell\'immobile al database', error);
    });
  }
      
  apriDialogNome(immobile: any) {
    this.selectedImmobile = immobile;
    document.getElementById('changeNameModal')!.style.display = 'block';
  }
  
  chiudiDialogNome() {
    document.getElementById('changeNameModal')!.style.display = 'none';
  }
    
  modificaNome() {
    const nameInput = <HTMLInputElement>document.getElementById('nameInput');
    const newName = nameInput.value;
    console.log(newName)
    if (newName !='' ) {
      const immobileDaRinominare = this.lista_immobili_candidati.find(i => i.coordinates === this.selectedImmobile.coordinates);
      // Chiamata al servizio per aggiornare il prezzo nel backend
      immobileDaRinominare!.nome = newName
      this.cambiaNomeMarkerImmobile(immobileDaRinominare);
    }    
    this.chiudiDialogNome()
  }

  cambiaNomeMarkerImmobile(immobile: any) {
    const color = this.getColorByRank(immobile.rank); 
    console.log("COLORE CAMBIATO: "+color)
    immobile.marker.setStyle(new Style({
      image: new Icon({
        src: `assets/PoI/marker-${color}.png`,
        anchor: [0.5, 1],
        scale: 0.12
      }),
      text: new Text({
        text: immobile.nome,
        offsetY: -25,
        font: 'bold 12px Arial, sans-serif', 
        fill: new Fill({
          color: '#000000'
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    }));
  }

  apriDialogPrezzo(immobile: any) {
    this.selectedImmobile = immobile;
    document.getElementById('priceModal')!.style.display = 'block';
  }
    
  chiudiDialogPrezzo() {
    document.getElementById('priceModal')!.style.display = 'none';
  }
    
  modificaPrezzo() {
    const priceInput = <HTMLInputElement>document.getElementById('priceInput');
    const newPrice = priceInput.value;
    console.log(newPrice)
    const immobileDaPrezzare = this.lista_immobili_candidati.find(i => i.coordinates === this.selectedImmobile.coordinates);
    const oldPrice = immobileDaPrezzare!.prezzo;
    if (Number(newPrice) !=null || Number(newPrice) !=0) {
      immobileDaPrezzare!.prezzo = Number(newPrice)
    }  
    this.chiudiDialogPrezzo()
    this.IndiceMoranIPrezzo(immobileDaPrezzare!.quartiere)
  }

  modificaRaggioImmobile(event: Event, immobile: any) {
    const input = event.target as HTMLInputElement;
    const nuovo_raggio_vicinato = Number(input.value);
    immobile.raggio_vicinato = nuovo_raggio_vicinato
    const username = localStorage.getItem('username')
    const marker = {
      type: 'Point',
      coordinates: immobile.coordinates
    };
    this.mapservice.modificaRaggioImmobile(marker, username!.toString(), nuovo_raggio_vicinato, this.questionarioData).subscribe(response => {
      const circleGeomObject = JSON.parse(response.circleGeom);
      const circleCoordinates = circleGeomObject.coordinates;
      const circleType = circleGeomObject.type;
      const geometryFeature = {
        type: circleType,
        coordinates: circleCoordinates
      };
      const circleFeature = new GeoJSON().readFeature({
        type: 'Feature',
        geometry: geometryFeature
      }, 
      {
        featureProjection: 'EPSG:3857'
      });
      console.log("RANK:"+response.rank)
      const color = this.getColorByRank(response.rank)
      immobile.rank = response.rank
      immobile.marker.setStyle(new Style({
        image: new Icon({
          src: `assets/PoI/marker-${color}.png`,
          anchor: [0.5, 1],
          scale: 0.12
        }),
        text: new Text({
          text: immobile.nome,
          offsetY: -25,
          font: 'bold 12px Arial', 
          fill: new Fill({
            color: '#000000'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      }));
      circleFeature.setStyle(new Style({
        stroke: new Stroke({
          color: color,
          width: 2,
          lineDash: [10, 10]
        })
      }));
      immobile.marker.set('type', 'marker');
      circleFeature.set('type', 'circle');
      this.vectorSource.removeFeature(immobile.circle)
      immobile.circle = circleFeature
      immobile.marker = immobile.marker
      this.vectorSource.addFeature(circleFeature);
      // Rimuove i PoI esistenti
      immobile.pois.forEach((poi:any) => {
        this.vectorSource.removeFeature(poi);
      });
      // Aggiunge i nuovi PoI
      immobile.pois = [];
      response.pois.forEach((poi: any) => {
        const poiCoordinates = fromLonLat([poi.lon, poi.lat]);
        const poiMarker = new Feature({
          geometry: new Point(poiCoordinates)
        });
        poiMarker.set('type', 'poi');
        poiMarker.setStyle(new Style({
          image: new Icon({
            src: `assets/PoI/${poi.type}_icon.png`,
            scale: 0.05
          })
        }));
        this.vectorSource.addFeature(poiMarker);
        immobile.pois.push(poiMarker);
      });     
    }, 
    error => {
      console.error('Errore durante l\'aggiunta dell\'immobile al database', error);
    });
  }
      
  modificaColoreMarker(immobile: any, rank: number) {
    // Rimuove il marker esistente
    this.vectorSource.removeFeature(immobile.marker);
    // Aggiunge un nuovo marker con il colore aggiornato
    const newMarker = new Feature({
      geometry: new Point(immobile.coordinates)
    });
    const color = this.getColorByRank(rank);
    newMarker.setStyle(new Style({
      image: new Icon({
        src: `assets/PoI/marker-${color}.png`,
        anchor: [0.5, 1],
        scale: 0.12
      }),
    }));
    newMarker.set('type', 'marker');
    this.vectorSource.addFeature(newMarker);
    immobile.circle.setStyle(new Style({
      stroke: new Stroke({
        color: color,
        width: 2,
        lineDash: [10, 10]
      })
    }));
    // Aggiorna i dati del marker
    immobile.marker = newMarker;
  }

  async IndiceMoranIPrezzo(quartiere: any){
    let immobili_candidati = this.lista_immobili_candidati.filter(data => data.prezzo > 0 && data.quartiere == quartiere.nome);
    const N = immobili_candidati.length
    if(N >= 6 && quartiere.prezzo_medio > 0){
      let W = 0;
      let prezzo_medio = quartiere.prezzo_medio;
      console.log("PREZZO MEDIO:" +prezzo_medio)
      let sommatoria_numeratore= 0;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) { // Inizia da j = i + 1 per evitare doppioni
          const distanza = await this.distanzaEuclidea(immobili_candidati[i].coordinates, immobili_candidati[j].coordinates);
          W = W + 1/distanza;
          sommatoria_numeratore =  sommatoria_numeratore+ (1/distanza) * (immobili_candidati[i].prezzo - prezzo_medio) * (immobili_candidati[j].prezzo - prezzo_medio);
        }
      }
      let sommatoria_denominatore= 0;
      for(let i =0; i < immobili_candidati.length; i++){
        sommatoria_denominatore = sommatoria_denominatore + (immobili_candidati[i].prezzo - prezzo_medio)*(immobili_candidati[i].prezzo - prezzo_medio)
      }
      const indice_moran = (N/W)*(sommatoria_numeratore/sommatoria_denominatore)
      return indice_moran;
    } 
    else {
      return NaN;
    }
  }

  async indiceMoranINumeroPoi(quartiere: any){
    let immobili_candidati = this.lista_immobili_candidati.filter(data => data.quartiere == quartiere.nome);
    const N = immobili_candidati.length
    if(N >= 6){
      let W = 0;
      let numero_poi_medio = 0;
      let numero_poi_totale = 0;
      for(let i =0; i < immobili_candidati.length; i++){
        numero_poi_totale = numero_poi_totale + immobili_candidati[i].pois.length;
      }
      numero_poi_medio = numero_poi_totale / immobili_candidati.length;
      let sommatoria_numeratore= 0;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) { // Inizia da j = i + 1 per evitare doppioni
          const distanza = await this.distanzaEuclidea(immobili_candidati[i].coordinates, immobili_candidati[j].coordinates);
          W = W + 1/distanza;
          sommatoria_numeratore =  sommatoria_numeratore+ 1/distanza * (immobili_candidati[i].pois.length - numero_poi_medio) * (immobili_candidati[j].pois.length - numero_poi_medio); 
        }
      }
      let sommatoria_denominatore= 0;
      for(let i =0; i < immobili_candidati.length; i++){
        sommatoria_denominatore = sommatoria_denominatore + (immobili_candidati[i].pois.length - numero_poi_medio)*(immobili_candidati[i].pois.length - numero_poi_medio)
      }
      const indice_moran = (N/W)*(sommatoria_numeratore/sommatoria_denominatore)
      console.log("INDICE DI MORAN POI: "+indice_moran)
      return indice_moran;
    } 
    else {
      return NaN;
    }
  }
      
      
      
      
  distanzaEuclidea(puntoA: [number, number], puntoB: [number, number]): number {
    const [x1, y1] = puntoA;
    const [x2, y2] = puntoB;
    const distanza = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distanza;
  }

/************************************************** CODICE RELATIVO ALLE AREE *************************************************/   

  aggiungiAreaDB() {
   
    this.drawInteraction = new Draw({
      source: this.drawSource,
      type: 'Polygon'
    });
    // Funzione che si attiva quando si smette di disegnare il poligono
    this.drawInteraction.on('drawend', (event) => {
      const area_di_base_feature = event.feature;
      area_di_base_feature.setStyle(new Style({
        stroke: new Stroke({
          color: 'rgba(1, 1, 1, 1)', 
          width: 2
        })
      }));
      area_di_base_feature.set('type', 'polygon'); // Mi serve quando poi clicco sul bottone "elimina immobile/area"
      this.vectorSource.addFeature(area_di_base_feature);
      
      const polygonGeom = area_di_base_feature.getGeometry() as Polygon;
      const polygonCoords = polygonGeom.getCoordinates();
      const convertedCoords = polygonCoords.map(ring => ring.map(coord => toLonLat(coord, 'EPSG:3857')));
      const polygonGeoJSON = {
        type: 'Polygon',
        coordinates: convertedCoords
      };
      const username = localStorage.getItem('username')
      
      this.mapservice.aggiungiAreaDB(polygonGeoJSON, username!.toString(), this.raggio_vicinato, this.questionarioData).subscribe(response => {
        const area_vicinato = JSON.parse(response.area)
        const area_vicinato_type = area_vicinato.type;
        const area_vicinato_coordinates = area_vicinato.coordinates;
        const geometryFeature = {
          type: area_vicinato_type,
          coordinates: area_vicinato_coordinates
        };
        const color =  this.getColorByRank(response.rank)
        
        const area_vicinato_feature = new GeoJSON().readFeature({
          type: 'Feature',
          geometry: geometryFeature
        }, 
        {
          featureProjection: 'EPSG:3857'
        });
        area_di_base_feature.setStyle(new Style({
          stroke: new Stroke({
            color: color, 
            width: 2
          })
        }));
        area_vicinato_feature.setStyle(new Style({
          stroke: new Stroke({
            color: color, 
            width: 2
          })
        }));
        // Aggiungi il nuovo poligono alla mappa
        this.vectorSource.addFeature(area_vicinato_feature);
        const pois_interni = response.pois_interni.map((poi: any) => {
          const poiCoordinates = fromLonLat([poi.lon, poi.lat]);
          const poiInterno = new Feature({
            geometry: new Point(poiCoordinates)
          });
          poiInterno.set('type', 'poi');
          poiInterno.setStyle(new Style({
            image: new Icon({
              src: `assets/PoI/${poi.type}_icon.png`,
              scale: 0.05
            })
          }));
          this.vectorSource.addFeature(poiInterno);
          return poiInterno;
        });
        const pois_esterni = response.pois_esterni.map((poi: any) => {
          const poiCoordinates = fromLonLat([poi.lon, poi.lat]);
          const poiEsterno = new Feature({
            geometry: new Point(poiCoordinates)
          });
          poiEsterno.set('type', 'poi');
          poiEsterno.setStyle(new Style({
            image: new Icon({
              src: `assets/PoI/${poi.type}_icon.png`,
              scale: 0.05
            })
          }));
          this.vectorSource.addFeature(poiEsterno);
          return poiEsterno;
        });
        this.lista_aree_candidate.push({ area_di_base: area_di_base_feature, area_vicinato: area_vicinato_feature, raggio_vicinato: this.raggio_vicinato, pois_interni: pois_interni
          , pois_esterni: pois_esterni, rank: response.rank
        });        
      },
      error => {
        console.error('Errore durante l\'aggiunta del poligono al database', error);
      });
          
    });
    if (this.mode === 'polygon') {
      this.map.addInteraction(this.drawInteraction);
    }
  }


  // Funzione chiamata dalla barra del raggio delle aree
  modificaRaggioArea(event: Event, area: any) {
    const input = event.target as HTMLInputElement;
    const nuovo_raggio_vicinato = Number(input.value);
    const polygonGeom = area.area_di_base.getGeometry() as Polygon;
    const polygonCoords = polygonGeom.getCoordinates();
    const convertedCoords = polygonCoords.map(ring => ring.map(coord => toLonLat(coord, 'EPSG:3857')));
    const area_di_base = {
      type: 'Polygon',
      coordinates: convertedCoords
    };
    if (this.isAreaRequestInProgress) {
      return; // Se una richiesta è in corso, non fare nulla
    }
    this.isAreaRequestInProgress = true;
    // Rimuovere la vecchia area e i POI esistenti dalla mappa
    if (area.area_vicinato) {
      this.vectorSource.removeFeature(area.area_vicinato);
    }
    if (area.pois_esterni) {
      area.pois_esterni.forEach((poi: any) => this.vectorSource.removeFeature(poi));
      area.pois_esterni = [];
    }
    this.mapservice.modificaRaggioArea(area_di_base, nuovo_raggio_vicinato, this.questionarioData).subscribe(
      response => {
        console.log("MODIFICA RAGGIO AVVENUTO CON SUCCESSO: "+ JSON.stringify(response))
        this.isAreaRequestInProgress = false; // La richiesta è completata
        console.log("RANK MODIFICATO: "+ JSON.stringify(response.rank))
       
        const area_vicinato = JSON.parse(response.area);
        const area_vicinato_type = area_vicinato.type;
        const area_vicinato_coordinates = area_vicinato.coordinates;
        const geometryFeature = {
          type: area_vicinato_type,
          coordinates: area_vicinato_coordinates
        };
        const area_vicinato_feature = new GeoJSON().readFeature({
          type: 'Feature',
          geometry: geometryFeature
        },
        {
          featureProjection: 'EPSG:3857'
        });
        // Aggiorna l'area candidata con il nuovo poligono
        area.area_vicinato = area_vicinato_feature;
        area.raggio_vicinato = nuovo_raggio_vicinato;
        area.rank = response.rank
        // Aggiungi i nuovi PoI
        const newPois = response.pois_esterni.map((poi: any) => {
          const poiCoordinates = fromLonLat([poi.lon, poi.lat]);
          const poiMarker = new Feature({
            geometry: new Point(poiCoordinates)
          });
          poiMarker.set('type', 'poi');
          poiMarker.setStyle(new Style({
            image: new Icon({
              src: `assets/PoI/${poi.type}_icon.png`,
              scale: 0.05
            })
          }));
            this.vectorSource.addFeature(poiMarker);
            return poiMarker;
          });
    
        area.pois_esterni = newPois;
        const color = this.getColorByRank(response.rank);
        area.area_di_base.setStyle(new Style({
          stroke: new Stroke({
            color: color, 
            width: 2
          })
        }))
        area_vicinato_feature.setStyle(new Style({
          stroke: new Stroke({
            color: color, 
            width: 2
          })
        }));
        this.vectorSource.addFeature(area_vicinato_feature);
      },
      error => {
        this.isAreaRequestInProgress = false; 
        console.error('Errore durante la modifica del raggio dell\'area', error);
      }
    );
  }
     
  // Funzione per rimuovere i poligoni associati all'utente
  rimuoviAreeDB(username: string) {
    this.mapservice.rimuoviAreeDB(username).subscribe(response => {
      console.log('Poligoni rimossi con successo', response);
    },
    error => {
      console.error('Errore durante la rimozione dei poligoni', error);
    });
  }

  


}




