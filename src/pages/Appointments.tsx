import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search, Calendar, Plus, Trash2, Edit } from 'lucide-react';
import { appointmentsAPI } from '../services/api';

const Appointments: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    vehicleNumber: '',
    appointmentDate: '',
    timeSlot: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentsAPI.getAll({ search: searchTerm });
      setAppointments(res.data?.appointments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, [searchTerm]);

  // Handle form input
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create appointment
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await appointmentsAPI.create({
        vehicleNumber: form.vehicleNumber,
        appointmentDate: form.appointmentDate,
        timeSlot: form.timeSlot,
        description: form.description,
      });
      setShowNewAppointment(false);
      setForm({ vehicleNumber: '', appointmentDate: '', timeSlot: '', description: '' });
      fetchAppointments();
    } catch (err: any) {
      setError(err.message || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete appointment
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    setLoading(true);
    setError(null);
    try {
      await appointmentsAPI.delete(id);
      fetchAppointments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete appointment');
    } finally {
      setLoading(false);
    }
  };

  // Prepare events for calendar
  const calendarEvents = appointments.map((a) => ({
    id: a.id,
    title: `${a.description || ''} - ${a.vehicle_number || ''}`.trim(),
    start: `${a.appointment_date}T${a.time_slot}`,
    end: `${a.appointment_date}T${a.time_slot}`,
    status: a.status,
  }));

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-3 gap-4">
        <div className="flex-1" />
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
            onClick={() => setShowNewAppointment(true)}
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
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : view === 'list' ? (
          <div className="space-y-4">
            {appointments.length === 0 && <div className="text-gray-500">No appointments found.</div>}
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 break-words">{appointment.description} - {appointment.vehicle_number}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(`${appointment.appointment_date}T${appointment.time_slot}`), 'PPP p')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' : appointment.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {appointment.status}
                  </span>
                  <div className="flex gap-2">
                    {/* <Button variant="outline" size="icon" onClick={() => handleEdit(appointment.id)}><Edit size={16} /></Button> */}
                    <Button variant="outline" size="icon" onClick={() => handleDelete(appointment.id)}><Trash2 size={16} /></Button>
                  </div>
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
              events={calendarEvents}
              editable={false}
              selectable={false}
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

            <form className="space-y-4" onSubmit={handleCreateAppointment}>
              <Input
                label="Vehicle Number"
                placeholder="Enter vehicle number"
                name="vehicleNumber"
                value={form.vehicleNumber}
                onChange={handleFormChange}
                fullWidth
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  name="appointmentDate"
                  value={form.appointmentDate}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
                <Input
                  label="Time Slot"
                  type="time"
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleFormChange}
                  fullWidth
                  required
                />
              </div>
              <Input
                label="Description"
                placeholder="Enter appointment details"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                fullWidth
                required
              />
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="w-full sm:w-auto"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto" loading={submitting}>
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