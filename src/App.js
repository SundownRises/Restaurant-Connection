import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Mock data for contacts
const mockContacts = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
  // Add more mock contacts as needed
];

// Mock data for contacts' Go-to Lists
const contactsGoToLists = {
  Alice: [
    { name: 'Burger Joint', location: '789 Maple Ave', rating: 4.2 },
    { name: 'Taco Stand', location: '101 Pine St', rating: 4.0 },
  ],
  Bob: [
    { name: 'Pasta Place', location: '202 Oak St', rating: 4.3 },
    { name: 'Curry House', location: '303 Birch St', rating: 4.6 },
  ],
  // Add more mock data as needed
};

function App() {
  const [goToList, setGoToList] = useState([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [view, setView] = useState('contacts');
  const [availableRestaurants, setAvailableRestaurants] = useState([]);
  const [minRating, setMinRating] = useState(4.2);
  const [sortBy, setSortBy] = useState('distance'); // New state for sorting
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchRestaurants = async (latitude, longitude) => {
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            location: `${latitude},${longitude}`,
            radius: 1500,
            type: 'restaurant',
            key: 'AIzaSyAfqc6ByrFwTBOfx8l9fSaVdeoWZ__FIRo', // Replace with your new API key
          },
        });
        setAvailableRestaurants(response.data.results);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      }
    };

    const initMap = (latitude, longitude) => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
      });

      const service = new window.google.maps.places.PlacesService(map);
      service.nearbySearch(
        {
          location: { lat: latitude, lng: longitude },
          radius: 1500,
          type: ['restaurant'],
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setAvailableRestaurants(results);
            results.forEach((place) => {
              new window.google.maps.Marker({
                position: place.geometry.location,
                map,
                title: place.name,
              });
            });
          }
        }
      );
    };

    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            initMap(latitude, longitude);
            fetchRestaurants(latitude, longitude);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    };

    getUserLocation();
  }, []);

  const addToGoToList = (restaurant) => {
    if (!goToList.includes(restaurant)) {
      setGoToList([...goToList, restaurant]);
    }
  };

  const removeFromGoToList = (restaurantToRemove) => {
    setGoToList(goToList.filter(restaurant => restaurant !== restaurantToRemove));
  };

  const handleSendMessage = () => {
    if (selectedContact && message) {
      const newMessage = `Message to ${selectedContact}: ${message}`;
      alert(newMessage);

      setChatHistory(prevHistory => ({
        ...prevHistory,
        [selectedContact]: [...(prevHistory[selectedContact] || []), message]
      }));

      setMessage('');
      setIsChatOpen(true); // Ensure chat opens when a message is sent
    } else {
      alert('Please select a contact and enter a message.');
    }
  };

  const openChat = (contactName) => {
    setSelectedContact(contactName);
    setIsChatOpen(true);
    setView('chat');
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setSelectedContact('');
    setView('contacts');
  };

  const sendQuickMessage = (contactName, placeName) => {
    const quickMessage = `I want to visit ${placeName} with you!`;
    setSelectedContact(contactName);
    setMessage(quickMessage);
    setIsChatOpen(true);
    setView('chat');
  };

  const sortRestaurants = (restaurants) => {
    return [...restaurants].sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance - b.distance; // Assuming distance is a property
      } else if (sortBy === 'cost') {
        return a.cost - b.cost; // Assuming cost is a property
      }
      return 0;
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Nearby Restaurant Meetup</h1>
        <h2>Available Restaurants</h2>
        <div className="filters">
          <label>
            Minimum Rating:
            <input
              type="number"
              step="0.1"
              value={minRating}
              onChange={(e) => setMinRating(parseFloat(e.target.value))}
              style={{ marginLeft: '10px', width: '50px' }}
            />
          </label>
          <label>
            Sort By:
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ marginLeft: '10px' }}>
              <option value="distance">Distance</option>
              <option value="cost">Cost per Head</option>
            </select>
          </label>
        </div>
        <div ref={mapRef} className="map-container"></div>
        <ul>
          {sortRestaurants(availableRestaurants
            .filter(restaurant => restaurant.rating >= minRating))
            .map((restaurant, index) => (
              <li key={index} className="discover-restaurant-item">
                {restaurant.name} - {restaurant.vicinity} - Rating: {restaurant.rating}
                <button onClick={() => addToGoToList(restaurant)}>Add to Go-to List</button>
              </li>
            ))}
        </ul>
        <h2>Your Go-to List</h2>
        <ul>
          {goToList.map((restaurant, index) => (
            <li key={index} className="go-to-list-item">
              {restaurant.name} - {restaurant.vicinity}
              <button onClick={() => removeFromGoToList(restaurant)}>Remove</button>
            </li>
          ))}
        </ul>
        <h2>Contacts' Go-to Lists</h2>
        {mockContacts.map((contact, index) => (
          <div key={index}>
            <h3>{contact.name}'s Go-to List</h3>
            <ul>
              {contactsGoToLists[contact.name].map((place, idx) => (
                <li key={idx} className="contacts-go-to-list-item">
                  {place.name} - {place.location} - Rating: {place.rating}
                  <button onClick={() => sendQuickMessage(contact.name, place.name)}>Quick Message</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <h2>Share with Contacts</h2>
        <ul>
          {mockContacts.map((contact, index) => (
            <li key={index}>
              {contact.name} - {contact.email}
            </li>
          ))}
        </ul>
      </header>
      {isChatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>CHATS</h3>
            <div className="chat-controls">
              <button onClick={closeChat} className="close">&times;</button>
            </div>
          </div>
          <div className="chat-navigation">
            <button onClick={() => setView('contacts')} className={view === 'contacts' ? 'active' : ''}>Contacts</button>
            <button onClick={() => setView('chat')} className={view === 'chat' ? 'active' : ''}>Chat</button>
          </div>
          {view === 'contacts' && (
            <div className="chat-contacts">
              {mockContacts.map((contact, index) => (
                <button
                  key={index}
                  className={`contact-button ${selectedContact === contact.name ? 'active' : ''}`}
                  onClick={() => openChat(contact.name)}
                >
                  {contact.name}
                </button>
              ))}
            </div>
          )}
          {view === 'chat' && isChatOpen && (
            <div className="chat-modal-content">
              <div className="chat-history">
                {chatHistory[selectedContact] ? (
                  <ul>
                    {chatHistory[selectedContact].map((msg, index) => (
                      <li key={index}>{msg}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No chat history available.</p>
                )}
              </div>
              <input
                type="text"
                placeholder="Enter your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={handleSendMessage}>Send Message</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
