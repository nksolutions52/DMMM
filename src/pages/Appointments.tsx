import React, { useState } from 'react';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search, Calendar, Plus } from 'lucide-react';

const mockAppointments = [
  {
    id: '1',
    title: 'Vehicle Transfer - KA01MJ2022',
    start: '2024-03-20T10:00:00',
    end: '2024-03-20T11:00:00',
    status: 'scheduled'
  },
  {
    id: '2',
    title: 'Fitness Test - MH02AB2021',
    start: '2024-03-21T14:30:00',
    end: '2024-03-21T15:30:00',
    status: 'completed'
  }
];

const Appointments: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleNewAppointment = () => {
    setShowNewAppointment(true);
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-3 gap-4">
        <div className="flex-1">
          {/* Empty div to maintain layout */}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant={view === 'list' ? 'primary' : 'outline'}
            onClick={() => setView('list')}
            className="w-full sm:w-auto"
          >
            List View
          </Button>
          <Button
            variant={view === 'calendar' ? 'primary' : 'outline'}
            onClick={() => setView('calendar')}
            leftIcon={<Calendar size={18} />}
            className="w-full sm:w-auto"
          >
            Calendar
          </Button>
          <Button
            onClick={handleNewAppointment}
            leftIcon={<Plus size={18} />}
            className="w-full sm:w-auto"
          >
            New Appointment
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-6">
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={18} />}
            fullWidth
          />
        </div>

        {view === 'list' ? (
          <div className="space-y-4">
            {mockAppointments.map((appointment) => (
              <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 break-words">{appointment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(appointment.start), 'PPP p')} - {format(new Date(appointment.end), 'p')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[400px] sm:h-[600px]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={mockAppointments}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              height="100%"
            />
          </div>
        )}
      </Card>

      {showNewAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Schedule Appointment</h2>
              <button
                onClick={() => setShowNewAppointment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form className="space-y-4">
              <Input
                label="Vehicle Number"
                placeholder="Enter vehicle number"
                fullWidth
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  fullWidth
                />
                <Input
                  label="Time Slot"
                  type="time"
                  fullWidth
                />
              </div>

              <Input
                label="Description"
                placeholder="Enter appointment details"
                fullWidth
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewAppointment(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  Create Appointment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default Appointments;