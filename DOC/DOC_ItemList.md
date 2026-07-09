# 📋 Guide : Afficher les items d'un ticket dans DetailTicket

## 🎯 Objectif

Lorsqu'on clique sur un ticket dans `ListeTicket`, afficher les détails du ticket **ET** la liste des items (assets) associés à ce ticket.

---

## 📁 Structure des fichiers

```
src/
├── pages/
│   └── frontoffice/
│       ├── ListeTicket.jsx      # Liste des tickets
│       └── DetailTicket.jsx     # Détail d'un ticket + ses items
├── components/
│   └── TicketItemsList.jsx      # Composant liste des items (à créer)
└── services/
    └── backoffice/
        └── TicketService.js     # Service avec méthode getItemByTicketId
```

---

## 🔧 1. Vérification du service TicketService

Assurez-vous que la méthode `getItemByTicketId` existe dans `TicketService.js` :

```javascript
// src/services/backoffice/TicketService.js

const API_BASE = import.meta.env.VITE_GLPI_URL;
const API_BASE_V1 = import.meta.env.VITE_GLPI_URL_V1;
const API_TOKEN_V1 = import.meta.env.VITE_GLPI_TOKEN_V1;

// Session token pour l'API V1
let sessionToken = null;

const getSessionToken = async () => {
    if (sessionToken) return sessionToken;
    
    const response = await fetch(`${API_BASE_V1}/initSession`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "App-Token": API_TOKEN_V1
        },
        body: JSON.stringify({ login: "glpi", password: "glpi" })
    });

    if (!response.ok) throw new Error("Échec d'authentification GLPI");
    
    const data = await response.json();
    sessionToken = data.session_token;
    return sessionToken;
};

const getAuthHeaders = async () => ({
    "Content-Type": "application/json",
    "Session-Token": await getSessionToken(),
    "App-Token": API_TOKEN_V1
});

const TicketService = {
    // ... autres méthodes (getAll, getById, create, etc.)

    // ✅ Méthode pour récupérer les items d'un ticket
    getItemByTicketId: async (ticketId) => {
        try {
            const headers = await getAuthHeaders();
            
            const response = await fetch(
                `${API_BASE_V1}/Item_Ticket?range=0-9999`,
                {
                    method: "GET",
                    headers: headers
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Erreur ${response.status}: ${errorBody}`);
            }

            const data = await response.json();
            
            // Filtre les items par tickets_id
            const items = Array.isArray(data) 
                ? data.filter(item => Number(item.tickets_id) === Number(ticketId))
                : [];

            console.log(`📦 Items pour le ticket ${ticketId}:`, items);
            return items;
        } catch (error) {
            console.error("Erreur récupération items du ticket:", error);
            return [];
        }
    },

    // ✅ Méthode pour récupérer les détails complets d'un item
    getItemDetails: async (itemtype, itemId) => {
        try {
            // Utilise l'API V1 pour récupérer les détails
            const headers = await getAuthHeaders();
            
            const response = await fetch(
                `${API_BASE_V1}/${itemtype}/${itemId}`,
                {
                    method: "GET",
                    headers: headers
                }
            );

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Erreur ${response.status}: ${errorBody}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Erreur récupération détails ${itemtype} ${itemId}:`, error);
            return null;
        }
    },

    // ✅ Méthode pour récupérer les items avec leurs détails
    getTicketItemsWithDetails: async (ticketId) => {
        try {
            // 1. Récupère les liens Item_Ticket
            const itemLinks = await TicketService.getItemByTicketId(ticketId);
            
            if (!itemLinks || itemLinks.length === 0) {
                return [];
            }

            // 2. Récupère les détails de chaque item
            const itemsWithDetails = await Promise.all(
                itemLinks.map(async (link) => {
                    try {
                        // Récupère les détails de l'item
                        const details = await TicketService.getItemDetails(
                            link.itemtype,
                            link.items_id
                        );

                        // Récupère l'image si disponible
                        let imageUrl = null;
                        if (details && details.id) {
                            try {
                                const docs = await fetch(
                                    `${API_BASE_V1}/Document_Item?items_id=${details.id}&itemtype=${link.itemtype}`,
                                    {
                                        method: "GET",
                                        headers: await getAuthHeaders()
                                    }
                                );
                                if (docs.ok) {
                                    const docLinks = await docs.json();
                                    if (docLinks && docLinks.length > 0) {
                                        const docResponse = await fetch(
                                            `${API_BASE_V1}/Document/${docLinks[0].documents_id}`,
                                            {
                                                method: "GET",
                                                headers: await getAuthHeaders()
                                            }
                                        );
                                        if (docResponse.ok) {
                                            const doc = await docResponse.json();
                                            imageUrl = doc.filepath || doc.filename;
                                        }
                                    }
                                }
                            } catch (e) {
                                console.warn("Pas d'image pour cet item");
                            }
                        }

                        return {
                            ...link,
                            details: details || null,
                            imageUrl: imageUrl
                        };
                    } catch (error) {
                        console.error(`Erreur récupération détails pour ${link.itemtype} ${link.items_id}:`, error);
                        return {
                            ...link,
                            details: null,
                            imageUrl: null
                        };
                    }
                })
            );

            return itemsWithDetails;
        } catch (error) {
            console.error("Erreur récupération items avec détails:", error);
            return [];
        }
    }
};

export default TicketService;
```

---

## 🖥️ 2. Création du composant TicketItemsList

### Composant : `src/components/TicketItemsList.jsx`

```javascript
// src/components/TicketItemsList.jsx
import { useState, useEffect } from 'react';
import Loader from './Loader';

function TicketItemsList({ ticketId, items, loading, onItemClick }) {
    const [expandedItems, setExpandedItems] = useState({});
    const [localItems, setLocalItems] = useState(items || []);

    useEffect(() => {
        setLocalItems(items || []);
    }, [items]);

    const toggleExpand = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    // Fonction pour obtenir l'icône selon le type
    const getItemIcon = (itemtype) => {
        const icons = {
            'Computer': '💻',
            'Monitor': '🖥️',
            'Printer': '🖨️',
            'NetworkEquipment': '🌐',
            'Phone': '📱',
            'Peripheral': '⌨️',
            'Software': '📦',
            'SoftwareLicense': '📜',
            'Certificate': '🔐',
            'PDU': '🔌',
            'Cable': '🔗',
            'Socket': '🔌',
            'Appliance': '📡',
            'PassiveDCEquipment': '📦',
            'Enclosure': '📦',
            'Rack': '🗄️'
        };
        return icons[itemtype] || '📄';
    };

    // Fonction pour obtenir la couleur selon le type
    const getItemColor = (itemtype) => {
        const colors = {
            'Computer': '#2196F3',
            'Monitor': '#9C27B0',
            'Printer': '#FF9800',
            'NetworkEquipment': '#4CAF50',
            'Phone': '#E91E63',
            'Peripheral': '#795548',
            'Software': '#607D8B',
            'SoftwareLicense': '#3F51B5',
            'Certificate': '#009688',
            'PDU': '#F44336',
            'Cable': '#8BC34A',
            'Socket': '#FFEB3B',
            'Appliance': '#00BCD4',
            'PassiveDCEquipment': '#9E9E9E',
            'Enclosure': '#673AB7',
            'Rack': '#FF5722'
        };
        return colors[itemtype] || '#757575';
    };

    if (loading) {
        return (
            <div className="items-loading">
                <Loader />
                <p>Chargement des items...</p>
            </div>
        );
    }

    if (!localItems || localItems.length === 0) {
        return (
            <div className="no-items">
                <div className="no-items-icon">📭</div>
                <p>Aucun item associé à ce ticket</p>
                <span className="no-items-sub">Aucun asset lié à ce ticket</span>
            </div>
        );
    }

    return (
        <div className="ticket-items-container">
            <div className="items-header">
                <h4>Items associés ({localItems.length})</h4>
                <span className="items-count-badge">{localItems.length}</span>
            </div>

            <div className="items-grid">
                {localItems.map((item) => {
                    const itemId = `${item.itemtype}-${item.items_id}`;
                    const isExpanded = expandedItems[itemId] || false;
                    const color = getItemColor(item.itemtype);
                    const icon = getItemIcon(item.itemtype);
                    const details = item.details || {};
                    const name = details?.name || `#${item.items_id}`;

                    return (
                        <div 
                            key={itemId} 
                            className="item-card"
                            style={{ borderLeftColor: color }}
                            onClick={() => onItemClick && onItemClick(item)}
                        >
                            <div className="item-card-header">
                                <div className="item-icon" style={{ backgroundColor: color + '20', color: color }}>
                                    {icon}
                                </div>
                                <div className="item-info">
                                    <div className="item-name">{name}</div>
                                    <div className="item-type">
                                        <span className="type-badge" style={{ backgroundColor: color }}>
                                            {item.itemtype}
                                        </span>
                                        <span className="item-id">ID: {item.items_id}</span>
                                    </div>
                                </div>
                                <button
                                    className="expand-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(itemId);
                                    }}
                                >
                                    {isExpanded ? '▲' : '▼'}
                                </button>
                            </div>

                            {isExpanded && details && (
                                <div className="item-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Nom:</span>
                                        <span className="detail-value">{details.name || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Marque:</span>
                                        <span className="detail-value">
                                            {details.manufacturer?.name || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Modèle:</span>
                                        <span className="detail-value">
                                            {details.model?.name || 'N/A'}
                                        </span>
                                    </div>
                                    {details.serial && (
                                        <div className="detail-row">
                                            <span className="detail-label">Série:</span>
                                            <span className="detail-value">{details.serial}</span>
                                        </div>
                                    )}
                                    {details.location && (
                                        <div className="detail-row">
                                            <span className="detail-label">Emplacement:</span>
                                            <span className="detail-value">
                                                {details.location?.name || 'N/A'}
                                            </span>
                                        </div>
                                    )}
                                    {details.status && (
                                        <div className="detail-row">
                                            <span className="detail-label">Statut:</span>
                                            <span className="detail-value">
                                                {details.status?.name || 'N/A'}
                                            </span>
                                        </div>
                                    )}
                                    {item.imageUrl && (
                                        <div className="detail-image">
                                            <img 
                                                src={item.imageUrl} 
                                                alt={name}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .ticket-items-container {
                    margin-top: 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 16px;
                    background: #fafafa;
                }

                .items-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid #e0e0e0;
                }

                .items-header h4 {
                    margin: 0;
                    color: #333;
                    font-size: 16px;
                }

                .items-count-badge {
                    background: #2196F3;
                    color: white;
                    border-radius: 20px;
                    padding: 2px 12px;
                    font-size: 14px;
                }

                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 12px;
                }

                .item-card {
                    background: white;
                    border-radius: 8px;
                    border-left: 4px solid #757575;
                    padding: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: all 0.2s;
                    cursor: pointer;
                }

                .item-card:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    transform: translateY(-1px);
                }

                .item-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .item-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    flex-shrink: 0;
                    background-color: #f0f0f0;
                }

                .item-info {
                    flex: 1;
                    min-width: 0;
                }

                .item-name {
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .item-type {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                }

                .type-badge {
                    padding: 2px 10px;
                    border-radius: 12px;
                    color: white;
                    font-size: 11px;
                    font-weight: 500;
                }

                .item-id {
                    color: #999;
                    font-size: 11px;
                }

                .expand-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    padding: 4px 8px;
                    font-size: 14px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .expand-btn:hover {
                    background: #f0f0f0;
                }

                .item-details {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #f0f0f0;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 0;
                    font-size: 13px;
                }

                .detail-label {
                    color: #666;
                    font-weight: 500;
                }

                .detail-value {
                    color: #333;
                    text-align: right;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .detail-image {
                    margin-top: 8px;
                    text-align: center;
                }

                .detail-image img {
                    max-width: 100%;
                    max-height: 150px;
                    border-radius: 4px;
                    border: 1px solid #e0e0e0;
                }

                .items-loading {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                }

                .no-items {
                    text-align: center;
                    padding: 40px 20px;
                    color: #999;
                }

                .no-items-icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }

                .no-items-sub {
                    font-size: 12px;
                    color: #ccc;
                    display: block;
                    margin-top: 4px;
                }
            `}</style>
        </div>
    );
}

export default TicketItemsList;
```

---

## 🖥️ 3. Mise à jour de DetailTicket

### Composant : `src/pages/frontoffice/DetailTicket.jsx`

```javascript
// src/pages/frontoffice/DetailTicket.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import TicketService from "../../services/backoffice/TicketService";
import Loader from "../../components/Loader";
import TicketItemsList from "../../components/TicketItemsList";

function DetailTicket() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemsLoading, setItemsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTicketData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1. Chargement du ticket
                const ticketData = await TicketService.getById(id);
                setTicket(ticketData);
                console.log("🎫 Ticket chargé:", ticketData);

                // 2. Chargement des items du ticket
                setItemsLoading(true);
                try {
                    const itemsData = await TicketService.getTicketItemsWithDetails(id);
                    setItems(itemsData);
                    console.log("📦 Items chargés:", itemsData);
                } catch (itemsErr) {
                    console.error("Erreur chargement items:", itemsErr);
                    setItems([]);
                } finally {
                    setItemsLoading(false);
                }
            } catch (error) {
                console.error("Erreur:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        loadTicketData();
    }, [id]);

    // Fonction pour obtenir le label de priorité
    const getPriorityLabel = (priority) => {
        const map = {
            1: "Très basse",
            2: "Basse",
            3: "Moyenne",
            4: "Haute",
            5: "Très haute",
            6: "Majeure"
        };
        return map[priority] || "Inconnue";
    };

    // Fonction pour obtenir la couleur de priorité
    const getPriorityColor = (priority) => {
        const map = {
            1: "#4CAF50",
            2: "#8BC34A",
            3: "#FFC107",
            4: "#FF9800",
            5: "#F44336",
            6: "#D32F2F"
        };
        return map[priority] || "#999";
    };

    if (loading) return <Loader />;
    if (error) return <div className="error">Erreur: {error}</div>;
    if (!ticket) return <div className="error">Ticket non trouvé</div>;

    return (
        <div className="detail-ticket-container">
            {/* En-tête avec navigation */}
            <div className="detail-header">
                <div className="header-left">
                    <Link to="/liste-ticket" className="back-link">
                        ← Retour à la liste
                    </Link>
                    <h1>Détail du ticket #{ticket.id}</h1>
                </div>
                <div className="header-actions">
                    <Link to={`/edit-ticket/${ticket.id}`} className="edit-btn">
                        ✏️ Modifier
                    </Link>
                </div>
            </div>

            {/* Informations principales du ticket */}
            <div className="ticket-info-grid">
                <div className="info-card">
                    <div className="info-label">Titre</div>
                    <div className="info-value">{ticket.name || "Sans titre"}</div>
                </div>
                <div className="info-card">
                    <div className="info-label">Statut</div>
                    <div className="info-value">
                        <span className="status-badge">
                            {ticket.status?.name || "Inconnu"}
                        </span>
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-label">Priorité</div>
                    <div className="info-value">
                        <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                        >
                            {getPriorityLabel(ticket.priority)}
                        </span>
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-label">Type</div>
                    <div className="info-value">
                        <span className="type-badge">
                            {ticket.type === 1 ? "Incident" : "Demande"}
                        </span>
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-label">Demandeur</div>
                    <div className="info-value">
                        {ticket.user_recipient?.name || "N/A"}
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-label">Date d'ouverture</div>
                    <div className="info-value">
                        {new Date(ticket.date_creation).toLocaleString('fr-FR')}
                    </div>
                </div>
                <div className="info-card">
                    <div className="info-label">Dernière modification</div>
                    <div className="info-value">
                        {new Date(ticket.date_mod).toLocaleString('fr-FR')}
                    </div>
                </div>
                {ticket.external_id && (
                    <div className="info-card">
                        <div className="info-label">Référence externe</div>
                        <div className="info-value">{ticket.external_id}</div>
                    </div>
                )}
            </div>

            {/* Description */}
            {ticket.content && (
                <div className="description-section">
                    <h3>Description</h3>
                    <div className="description-content">
                        {ticket.content}
                    </div>
                </div>
            )}

            {/* Liste des items associés */}
            <TicketItemsList
                ticketId={ticket.id}
                items={items}
                loading={itemsLoading}
                onItemClick={(item) => {
                    console.log("Item cliqué:", item);
                    // Rediriger vers le détail de l'item si besoin
                    // navigate(`/detail-item/${item.itemtype}/${item.items_id}`);
                }}
            />

            <style jsx>{`
                .detail-ticket-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: 'Segoe UI', Roboto, sans-serif;
                }

                .detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #e0e0e0;
                }

                .header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .header-left h1 {
                    margin: 0;
                    color: #333;
                    font-size: 24px;
                }

                .back-link {
                    color: #2196F3;
                    text-decoration: none;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .back-link:hover {
                    text-decoration: underline;
                }

                .edit-btn {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: background 0.2s;
                }

                .edit-btn:hover {
                    background: #388E3C;
                }

                .ticket-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .info-card {
                    background: #f5f5f5;
                    padding: 12px 16px;
                    border-radius: 8px;
                }

                .info-label {
                    font-size: 12px;
                    color: #999;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }

                .info-value {
                    font-size: 15px;
                    color: #333;
                    font-weight: 500;
                }

                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    background: #e0e0e0;
                    font-size: 13px;
                }

                .priority-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    color: white;
                    font-size: 13px;
                }

                .type-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    background: #e3f2fd;
                    color: #1565C0;
                    font-size: 13px;
                }

                .description-section {
                    margin-bottom: 24px;
                }

                .description-section h3 {
                    color: #333;
                    margin-bottom: 8px;
                    font-size: 16px;
                }

                .description-content {
                    background: #fafafa;
                    padding: 16px;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                    white-space: pre-wrap;
                    line-height: 1.6;
                }

                .error {
                    color: #f44336;
                    padding: 20px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
}

export default DetailTicket;
```

---

## 🚀 4. Utilisation dans ListeTicket

### Mise à jour de ListeTicket (déjà correct)

```javascript
// src/pages/frontoffice/ListeTicket.jsx
// Le code existant est déjà correct, il utilise Link vers /detail-ticket/${tickets.id}

import { useEffect, useState } from "react";
import TicketService from "../../services/backoffice/TicketService";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";

function ListeTicket() {
    const [ticket, setTicket] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadticket = async () => {
            try {
                const data = await TicketService.getAll();
                setTicket(data);
            } catch (error) {
                console.error("Erreur:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        loadticket();
    }, []);

    if (loading) return <Loader />;
    if (error) return <div className="error">Erreur: {error}</div>;

    return (
        <div className="page-shell space-y-6">
            <div className="toolbar">
                <div>
                    <p className="muted uppercase tracking-[0.2em]">Backoffice</p>
                    <h1>Liste des tickets</h1>
                </div>
            </div>

            {ticket.length > 0 ? (
                <div className="ticket-grid">
                    {ticket.map((tickets) => (
                        <Link 
                            key={tickets.id} 
                            to={`/detail-ticket/${tickets.id}`}
                            className="ticket-card-link"
                        >
                            <div className="ticket-card">
                                <div className="ticket-card-header">
                                    <span className="ticket-id">#{tickets.id}</span>
                                    <span className="ticket-status">
                                        {tickets.status?.name || "Inconnu"}
                                    </span>
                                </div>
                                <h3 className="ticket-title">{tickets.name || "Sans titre"}</h3>
                                <div className="ticket-meta">
                                    <span>👤 {tickets.user_recipient?.name || "N/A"}</span>
                                    <span>📅 {new Date(tickets.date_creation).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="muted">Aucun ticket trouvé.</p>
            )}

            <style jsx>{`
                .ticket-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }

                .ticket-card-link {
                    text-decoration: none;
                    color: inherit;
                }

                .ticket-card {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 16px;
                    transition: all 0.2s;
                    cursor: pointer;
                }

                .ticket-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                    border-color: #2196F3;
                }

                .ticket-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .ticket-id {
                    font-weight: 600;
                    color: #2196F3;
                    font-size: 14px;
                }

                .ticket-status {
                    font-size: 12px;
                    padding: 2px 10px;
                    border-radius: 12px;
                    background: #e0e0e0;
                    color: #666;
                }

                .ticket-title {
                    margin: 8px 0;
                    font-size: 16px;
                    color: #333;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .ticket-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: #999;
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #f0f0f0;
                }
            `}</style>
        </div>
    );
}

export default ListeTicket;
```

---

## 📊 5. Routes (si nécessaire)

### Ajout de la route dans `App.jsx` ou `Router.jsx`

```javascript
// src/App.jsx ou src/Router.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ListeTicket from './pages/frontoffice/ListeTicket';
import DetailTicket from './pages/frontoffice/DetailTicket';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ... autres routes ... */}
                <Route path="/liste-ticket" element={<ListeTicket />} />
                <Route path="/detail-ticket/:id" element={<DetailTicket />} />
                {/* ... autres routes ... */}
            </Routes>
        </BrowserRouter>
    );
}

export default App;
```

---

## ✅ Résumé des modifications

| Fichier | Modification |
|---------|--------------|
| `TicketService.js` | Ajout de `getTicketItemsWithDetails()` et `getItemDetails()` |
| `TicketItemsList.jsx` | **Nouveau** : Composant d'affichage des items |
| `DetailTicket.jsx` | Ajout de l'appel à `getTicketItemsWithDetails()` et intégration de `TicketItemsList` |
| `ListeTicket.jsx` | Déjà fonctionnel avec `Link` |

---

## 🔑 Points clés

1. **API V1** : Utilisation de `Item_Ticket` pour les relations
2. **Session Token** : Authentification pour l'API V1
3. **Détails des items** : Appel à `/{itemtype}/{items_id}`
4. **Images** : Récupération via `Document_Item` et `Document`
5. **Expansion** : Affichage des détails au clic

---

## 🎯 Résultat attendu

1. ✅ Clique sur un ticket dans la liste → redirection vers `/detail-ticket/{id}`
2. ✅ Affichage des informations du ticket (titre, statut, priorité, etc.)
3. ✅ Affichage de la liste des items associés au ticket
4. ✅ Possibilité d'expandre chaque item pour voir ses détails
5. ✅ Affichage des images si disponibles