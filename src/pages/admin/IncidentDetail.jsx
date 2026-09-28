import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import IncidentPanel from '../../components/admin/IncidentPanel';

export default function IncidentDetail() {
  const { id } = useParams();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft size={16} /> Dashboard
      </Link>
      <IncidentPanel incidentId={id} showMap />
    </div>
  );
}