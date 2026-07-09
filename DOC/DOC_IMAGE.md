# 🖼️ Guide : Afficher les images des items dans React

## 📋 Contexte

Dans votre projet, les images sont stockées dans GLPI et liées aux assets via la table `Document_Item`. Voici comment les récupérer et les afficher dans React.

---

## 🔍 Architecture des images dans GLPI

### Structure des données

```sql
-- Tables concernées
Document           -- Métadonnées des documents (nom, type, etc.)
Document_Item      -- Liaison entre documents et assets
  ├── documents_id  -- ID du document
  ├── items_id      -- ID de l'asset (Computer, Monitor, etc.)
  └── itemtype      -- Type de l'asset (Computer, Monitor, etc.)
```

---

## 📁 1. Création du service de gestion des images

### Service : `src/services/backoffice/DocumentService.js`

```javascript
// src/services/backoffice/DocumentService.js

const API_BASE = import.meta.env.VITE_GLPI_URL;
const API_BASE_V1 = import.meta.env.VITE_GLPI_URL_V1;
const API_TOKEN = import.meta.env.VITE_GLPI_TOKEN;
const API_TOKEN_V1 = import.meta.env.VITE_GLPI_TOKEN_V1;

const headers = {
    Authorization: `Bearer ${API_TOKEN}`,
    Accept: "application/json"
};

const getSessionToken = async () => {
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
    return data.session_token;
};

const DocumentService = {
    // Récupère les documents liés à un item (asset)
    getDocumentsByItem: async (itemId, itemtype) => {
        try {
            const sessionToken = await getSessionToken();
            
            // 1. Récupère les liens Document_Item
            const linkResponse = await fetch(
                `${API_BASE_V1}/Document_Item?items_id=${itemId}&itemtype=${itemtype}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Session-Token": sessionToken,
                        "App-Token": API_TOKEN_V1
                    }
                }
            );

            if (!linkResponse.ok) {
                console.warn(`Aucun document pour ${itemtype} ${itemId}`);
                return [];
            }

            const links = await linkResponse.json();
            console.log("📄 Liens Document_Item:", links);

            if (!links || links.length === 0) return [];

            // 2. Récupère les documents correspondants
            const documents = await Promise.all(
                links.map(async (link) => {
                    const docResponse = await fetch(
                        `${API_BASE_V1}/Document/${link.documents_id}`,
                        {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                "Session-Token": sessionToken,
                                "App-Token": API_TOKEN_V1
                            }
                        }
                    );

                    if (!docResponse.ok) return null;
                    const document = await docResponse.json();
                    
                    // Récupère l'URL de l'image
                    const imageUrl = document.filepath || document.filename;
                    
                    return {
                        id: document.id,
                        name: document.name,
                        filename: document.filename,
                        filepath: document.filepath,
                        imageUrl: imageUrl,
                        mimeType: document.mime_type
                    };
                })
            );

            // Filtre les documents null et ne garde que les images
            return documents
                .filter(doc => doc && doc.mimeType && doc.mimeType.startsWith('image/'))
                .filter(doc => doc); // Supprime les null

        } catch (error) {
            console.error("Erreur lors de la récupération des documents:", error);
            return [];
        }
    },

    // Récupère l'URL de l'image directement
    getImageUrl: async (documentId) => {
        try {
            const sessionToken = await getSessionToken();
            
            const response = await fetch(
                `${API_BASE_V1}/Document/${documentId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Session-Token": sessionToken,
                        "App-Token": API_TOKEN_V1
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const document = await response.json();
            
            // Retourne l'URL complète de l'image
            if (document.filepath) {
                // Si filepath est relatif, construire l'URL complète
                if (document.filepath.startsWith('/')) {
                    return `${API_BASE}/front/document.send.php?docid=${document.id}`;
                }
                return document.filepath;
            }
            
            return null;
        } catch (error) {
            console.error("Erreur lors de la récupération de l'image:", error);
            return null;
        }
    },

    // Upload d'une image pour un item
    uploadImage: async (itemId, itemtype, file, sessionToken = null) => {
        try {
            const token = sessionToken || await getSessionToken();
            
            // 1. Upload du document
            const formData = new FormData();
            formData.append("uploadManifest", JSON.stringify({
                input: {
                    name: `Photo - ${file.name}`,
                    _filename: [file.name]
                }
            }));
            formData.append("filename[]", file, file.name);

            const uploadResponse = await fetch(`${API_BASE_V1}/Document`, {
                method: "POST",
                headers: {
                    "Session-Token": token,
                    "App-Token": API_TOKEN_V1
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error(`Échec upload: ${await uploadResponse.text()}`);
            }

            const uploadResult = await uploadResponse.json();
            const documentId = uploadResult.id;

            // 2. Lier le document à l'item
            const linkResponse = await fetch(`${API_BASE_V1}/Document_Item`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Session-Token": token,
                    "App-Token": API_TOKEN_V1
                },
                body: JSON.stringify({
                    input: {
                        documents_id: documentId,
                        items_id: itemId,
                        itemtype: itemtype
                    }
                })
            });

            if (!linkResponse.ok) {
                throw new Error(`Échec liaison: ${await linkResponse.text()}`);
            }

            return await linkResponse.json();
        } catch (error) {
            console.error("Erreur lors de l'upload de l'image:", error);
            throw error;
        }
    },

    // Supprime une image
    deleteImage: async (documentId, sessionToken = null) => {
        try {
            const token = sessionToken || await getSessionToken();

            // 1. Supprime les liens Document_Item
            const linkResponse = await fetch(
                `${API_BASE_V1}/Document_Item?documents_id=${documentId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Session-Token": token,
                        "App-Token": API_TOKEN_V1
                    }
                }
            );

            if (linkResponse.ok) {
                const links = await linkResponse.json();
                for (const link of links) {
                    await fetch(`${API_BASE_V1}/Document_Item/${link.id}`, {
                        method: "DELETE",
                        headers: {
                            "Session-Token": token,
                            "App-Token": API_TOKEN_V1
                        }
                    });
                }
            }

            // 2. Supprime le document
            const response = await fetch(`${API_BASE_V1}/Document/${documentId}`, {
                method: "DELETE",
                headers: {
                    "Session-Token": token,
                    "App-Token": API_TOKEN_V1
                }
            });

            if (!response.ok) {
                throw new Error(`Échec suppression: ${await response.text()}`);
            }

            return true;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'image:", error);
            throw error;
        }
    },

    // Récupère les images pour plusieurs items (optimisé)
    getImagesForItems: async (items) => {
        const results = {};
        
        await Promise.all(
            items.map(async (item) => {
                const key = `${item.type}-${item.id}`;
                results[key] = await DocumentService.getDocumentsByItem(item.id, item.type);
            })
        );

        return results;
    }
};

export default DocumentService;
```

---

## 🖼️ 2. Composant d'affichage des images

### Composant : `src/components/ImageGallery.jsx`

```javascript
// src/components/ImageGallery.jsx
import { useState, useEffect } from 'react';
import DocumentService from '../services/backoffice/DocumentService';
import Loader from './Loader';

function ImageGallery({ itemId, itemtype, onImageUpload, onImageDelete }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadImages();
    }, [itemId, itemtype]);

    const loadImages = async () => {
        setLoading(true);
        setError(null);
        try {
            const docs = await DocumentService.getDocumentsByItem(itemId, itemtype);
            setImages(docs);
        } catch (err) {
            console.error("Erreur chargement images:", err);
            setError("Impossible de charger les images");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validation du type
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner une image');
            return;
        }

        // Validation de la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('L\'image ne doit pas dépasser 5MB');
            return;
        }

        setUploading(true);
        try {
            await DocumentService.uploadImage(itemId, itemtype, file);
            await loadImages(); // Recharge les images
            if (onImageUpload) onImageUpload(file);
        } catch (err) {
            console.error("Erreur upload:", err);
            alert("Erreur lors de l'upload de l'image");
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    const handleDeleteImage = async (documentId) => {
        if (!window.confirm('Supprimer cette image ?')) return;

        try {
            await DocumentService.deleteImage(documentId);
            await loadImages(); // Recharge les images
            if (onImageDelete) onImageDelete(documentId);
        } catch (err) {
            console.error("Erreur suppression:", err);
            alert("Erreur lors de la suppression de l'image");
        }
    };

    if (loading) return <Loader />;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="image-gallery">
            <div className="image-gallery-header">
                <h4>Images ({images.length})</h4>
                <label className="upload-btn">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    {uploading ? 'Upload en cours...' : '+ Ajouter'}
                </label>
            </div>

            {images.length === 0 ? (
                <p className="no-images">Aucune image associée</p>
            ) : (
                <div className="image-grid">
                    {images.map((image) => (
                        <div key={image.id} className="image-card">
                            <img
                                src={image.imageUrl}
                                alt={image.name || image.filename}
                                className="image-thumbnail"
                                onError={(e) => {
                                    e.target.src = '/placeholder-image.png';
                                }}
                            />
                            <div className="image-overlay">
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteImage(image.id)}
                                    title="Supprimer"
                                >
                                    ✕
                                </button>
                                <span className="image-name">
                                    {image.name || image.filename}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .image-gallery {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 16px;
                    background: #fafafa;
                }

                .image-gallery-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .upload-btn {
                    display: inline-block;
                    padding: 8px 16px;
                    background: #4CAF50;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                }

                .upload-btn:hover {
                    background: #45a049;
                }

                .upload-btn input[type="file"] {
                    display: none;
                }

                .image-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 12px;
                }

                .image-card {
                    position: relative;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                    aspect-ratio: 1;
                    background: white;
                }

                .image-thumbnail {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .image-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 8px;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .image-card:hover .image-overlay {
                    opacity: 1;
                }

                .delete-btn {
                    align-self: flex-end;
                    background: #e53935;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    transition: background 0.2s;
                }

                .delete-btn:hover {
                    background: #c62828;
                }

                .image-name {
                    color: white;
                    font-size: 12px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .no-images {
                    color: #999;
                    text-align: center;
                    padding: 20px;
                }
            `}</style>
        </div>
    );
}

export default ImageGallery;
```

---

## 🖥️ 3. Intégration dans les listes d'items

### Exemple : ListeComputer avec images

```javascript
// src/pages/backoffice/ListeComputer.jsx
import { useEffect, useState } from "react";
import ComputerService from "../../services/backoffice/ComputerService";
import DocumentService from "../../services/backoffice/DocumentService";
import Loader from "../../components/Loader";
import ImageGallery from "../../components/ImageGallery";

function ListeComputer({ searchName = "", searchBrand = "" }) {
    const [computers, setComputers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedComputer, setSelectedComputer] = useState(null);
    const [showImages, setShowImages] = useState(false);

    useEffect(() => {
        const loadComputers = async () => {
            try {
                const data = await ComputerService.getAll();
                setComputers(data);
            } catch (error) {
                console.error("Erreur:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        loadComputers();
    }, []);

    const filtered = computers.filter((computer) => {
        const name = (computer.name || "").toLowerCase();
        const brand = (computer.manufacturer?.name || "").toLowerCase();
        return (
            name.includes(searchName) &&
            brand.includes(searchBrand)
        );
    });

    if (loading) return <Loader />;
    if (error) return <div className="error">Erreur: {error}</div>;

    return (
        <div className="panel">
            <h3>Ordinateurs ({filtered.length})</h3>
            {filtered.length > 0 ? (
                <div className="overflow-x-auto">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nom</th>
                                <th>Marque</th>
                                <th>Modèle</th>
                                <th>Numéro de série</th>
                                <th>Image</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((computer) => (
                                <tr key={computer.id}>
                                    <td>{computer.id}</td>
                                    <td>{computer.name || "—"}</td>
                                    <td>{computer.manufacturer?.name || "—"}</td>
                                    <td>{computer.model?.name || "—"}</td>
                                    <td>{computer.serial || "—"}</td>
                                    <td>
                                        <button
                                            className="image-btn"
                                            onClick={() => {
                                                setSelectedComputer(computer);
                                                setShowImages(true);
                                            }}
                                        >
                                            🖼️ Voir
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="detail-btn"
                                            onClick={() => {
                                                setSelectedComputer(computer);
                                                // Ouvrir un modal de détails
                                            }}
                                        >
                                            Détails
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="muted">Aucun ordinateur trouvé.</p>
            )}

            {/* Modal d'images */}
            {showImages && selectedComputer && (
                <div className="modal-overlay" onClick={() => setShowImages(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Images de {selectedComputer.name}</h3>
                            <button
                                className="close-modal"
                                onClick={() => setShowImages(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <ImageGallery
                            itemId={selectedComputer.id}
                            itemtype="Computer"
                            onImageUpload={() => {
                                console.log('Image uploadée');
                            }}
                            onImageDelete={() => {
                                console.log('Image supprimée');
                            }}
                        />
                    </div>
                </div>
            )}

            <style jsx>{`
                .image-btn {
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .image-btn:hover {
                    background: #1976D2;
                }

                .detail-btn {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 12px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .detail-btn:hover {
                    background: #388E3C;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    max-width: 700px;
                    width: 95%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .close-modal {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                }

                .close-modal:hover {
                    color: #333;
                }
            `}</style>
        </div>
    );
}

export default ListeComputer;
```

---

## 🖼️ 4. Composant miniature d'image (Thumbnail)

### Composant : `src/components/ImageThumbnail.jsx`

```javascript
// src/components/ImageThumbnail.jsx
import { useState, useEffect } from 'react';
import DocumentService from '../services/backoffice/DocumentService';

function ImageThumbnail({ itemId, itemtype, size = 50, onClick }) {
    const [imageUrl, setImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadThumbnail = async () => {
            try {
                const docs = await DocumentService.getDocumentsByItem(itemId, itemtype);
                if (docs && docs.length > 0) {
                    setImageUrl(docs[0].imageUrl);
                }
            } catch (error) {
                console.error("Erreur chargement thumbnail:", error);
            } finally {
                setLoading(false);
            }
        };

        loadThumbnail();
    }, [itemId, itemtype]);

    if (loading) {
        return (
            <div
                className="thumbnail-loading"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className="thumbnail-container"
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt="Thumbnail"
                    className="thumbnail-image"
                    onError={(e) => {
                        e.target.src = '/placeholder-image.png';
                    }}
                />
            ) : (
                <div className="thumbnail-placeholder">
                    <span>📷</span>
                </div>
            )}

            <style jsx>{`
                .thumbnail-container {
                    border-radius: 4px;
                    overflow: hidden;
                    cursor: pointer;
                    border: 1px solid #ddd;
                    flex-shrink: 0;
                }

                .thumbnail-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .thumbnail-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f0f0f0;
                    color: #ccc;
                    font-size: 20px;
                }

                .thumbnail-loading {
                    background: #f0f0f0;
                    border-radius: 4px;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default ImageThumbnail;
```

---

## 📱 5. Utilisation dans la Kanban

### Modification de KanbanCard pour afficher les images

```javascript
// src/components/KanbanCard.jsx
import { useState, useEffect } from 'react';
import ImageThumbnail from './ImageThumbnail';
import DocumentService from '../services/backoffice/DocumentService';

function KanbanCard({ title, description, itemId, itemtype }) {
    const [images, setImages] = useState([]);
    const [showImages, setShowImages] = useState(false);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const docs = await DocumentService.getDocumentsByItem(itemId, itemtype);
                setImages(docs);
            } catch (error) {
                console.error("Erreur chargement images carte:", error);
            }
        };
        loadImages();
    }, [itemId, itemtype]);

    const handleDragStart = (e) => {
        e.dataTransfer.setData("itemId", itemId);
        e.dataTransfer.effectAllowed = "move";
    };

    return (
        <div
            className="card"
            draggable
            onDragStart={handleDragStart}
            style={{ cursor: "grab" }}
        >
            <div className="card-header">
                <h2>{title}</h2>
                <span className="card-badge">#{itemId}</span>
            </div>
            
            <p>{description}</p>

            {/* Affichage des miniatures */}
            {images.length > 0 && (
                <div className="card-images-preview">
                    <div className="image-miniatures">
                        {images.slice(0, 3).map((image, index) => (
                            <div key={image.id} className="miniature">
                                <img
                                    src={image.imageUrl}
                                    alt={`Image ${index + 1}`}
                                    onError={(e) => {
                                        e.target.src = '/placeholder-image.png';
                                    }}
                                />
                            </div>
                        ))}
                        {images.length > 3 && (
                            <div className="more-images">
                                +{images.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="card-actions">
                {images.length > 0 && (
                    <button
                        className="view-images-btn"
                        onClick={() => setShowImages(!showImages)}
                    >
                        🖼️ {images.length} image(s)
                    </button>
                )}
            </div>

            {/* Modal des images */}
            {showImages && (
                <div className="image-modal" onClick={() => setShowImages(false)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowImages(false)}>
                            ✕
                        </button>
                        <div className="image-gallery-full">
                            {images.map((image) => (
                                <img
                                    key={image.id}
                                    src={image.imageUrl}
                                    alt={image.name}
                                    className="full-image"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-image.png';
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .card {
                    background: white;
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: box-shadow 0.2s;
                }

                .card:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .card-header h2 {
                    font-size: 14px;
                    margin: 0;
                }

                .card-badge {
                    background: #e0e0e0;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    color: #666;
                }

                .card p {
                    font-size: 13px;
                    color: #666;
                    margin: 8px 0;
                }

                .card-images-preview {
                    margin: 8px 0;
                }

                .image-miniatures {
                    display: flex;
                    gap: 4px;
                    flex-wrap: wrap;
                }

                .miniature {
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid #ddd;
                }

                .miniature img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .more-images {
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    background: #f0f0f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    color: #666;
                    border: 1px solid #ddd;
                }

                .card-actions {
                    margin-top: 8px;
                }

                .view-images-btn {
                    background: none;
                    border: none;
                    color: #2196F3;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 4px 8px;
                }

                .view-images-btn:hover {
                    background: #f0f0f0;
                    border-radius: 4px;
                }

                .image-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .image-modal-content {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    max-width: 90%;
                    max-height: 90%;
                    overflow-y: auto;
                    position: relative;
                }

                .close-modal {
                    position: sticky;
                    top: 0;
                    float: right;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #333;
                    z-index: 1;
                }

                .image-gallery-full {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                    margin-top: 16px;
                }

                .full-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 4px;
                    border: 1px solid #ddd;
                }
            `}</style>
        </div>
    );
}

export default KanbanCard;
```

---

## 📦 6. Optimisation des performances

### Composant : `src/hooks/useImages.js`

```javascript
// src/hooks/useImages.js
import { useState, useEffect, useCallback } from 'react';
import DocumentService from '../services/backoffice/DocumentService';

// Cache pour éviter de recharger les images
const imageCache = new Map();

export function useImages(itemId, itemtype) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cacheKey = `${itemtype}-${itemId}`;

    const loadImages = useCallback(async () => {
        if (!itemId || !itemtype) {
            setImages([]);
            setLoading(false);
            return;
        }

        // Vérifie le cache
        if (imageCache.has(cacheKey)) {
            setImages(imageCache.get(cacheKey));
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const docs = await DocumentService.getDocumentsByItem(itemId, itemtype);
            imageCache.set(cacheKey, docs);
            setImages(docs);
        } catch (err) {
            console.error("Erreur chargement images:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [itemId, itemtype, cacheKey]);

    useEffect(() => {
        loadImages();
    }, [loadImages]);

    const refresh = useCallback(() => {
        imageCache.delete(cacheKey);
        loadImages();
    }, [cacheKey, loadImages]);

    return { images, loading, error, refresh };
}

export default useImages;
```

---

## 🎯 Résumé des étapes

1. **Créer `DocumentService.js`** : Service d'appel API GLPI
2. **Créer `ImageGallery.jsx`** : Composant d'affichage des images
3. **Créer `ImageThumbnail.jsx`** : Miniature pour les listes
4. **Intégrer dans les listes** : Ajouter le bouton "Voir images"
5. **Intégrer dans Kanban** : Afficher les miniatures
6. **Optimiser avec `useImages`** : Mise en cache

---

## 🔑 Points clés

- **Session Token** : Nécessaire pour l'API GLPI V1
- **Document_Item** : Table de liaison entre documents et assets
- **Mime Type** : Filtre pour ne garder que les images
- **Gestion d'erreurs** : Afficher une image placeholder en cas d'échec
- **Cache** : Optimiser les performances avec un cache

---

## 🚀 Améliorations possibles

1. **Lazy loading** des images
2. **Zoom** sur les images
3. **Téléchargement** des images
4. **Compression** automatique
5. **Slideshow** pour plusieurs images
6. **Drag & Drop** pour le réarrangement
7. **Redimensionnement** automatique