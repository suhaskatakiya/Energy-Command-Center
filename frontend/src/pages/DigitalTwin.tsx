import React from 'react';
import MapView from '../components/MapView';
import KnowledgeGraph from '../components/KnowledgeGraph';

const DigitalTwin: React.FC = () => {
  console.log("DigitalTwin page rendered");
  return (
    <div className="space-y-8 pb-16">
      <MapView />
      <KnowledgeGraph />
    </div>
  );
};

export default DigitalTwin;
