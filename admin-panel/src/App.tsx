import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Search, User } from "lucide-react";

// The backend app.js does not have /api/v1 prefix, it mounts at /admin
const API_URL = "http://localhost:3000";

// Set VITE_ADMIN_TOKEN in a local .env file if your backend still requires auth.
const token = (import.meta as any).env?.VITE_ADMIN_TOKEN || "";

type Driver = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  driverStatus: string;
  driverPhoto: string;
  license: {
    number: string;
    photo: string;
    expDate: string;
  };
  registration: {
    photo: string;
  };
};

function App() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // In a real application, ensure you attach the Bearer token
      const res = await axios.get(`${API_URL}/admin/drivers/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(res.data.drivers || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleVerify = async (id: string) => {
    if (!confirm("Are you sure you want to verify this driver?")) return;
    try {
      await axios.post(`${API_URL}/admin/drivers/${id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDrivers(); // Refresh list
    } catch (error) {
      console.error("Error verifying driver:", error);
      alert("Verification failed");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason (required):");
    if (!reason) return;

    try {
      await axios.post(`${API_URL}/admin/drivers/${id}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDrivers(); // Refresh list
    } catch (error) {
      console.error("Error rejecting driver:", error);
      alert("Rejection failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500">Manage Driver Verifications</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <User size={24} />
          </div>
        </header>

        <main className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Pending Review ({drivers.length})</h2>
            <div className="flex bg-gray-100 items-center px-4 py-2 rounded-lg text-gray-500">
               <Search size={18} className="mr-2" />
               <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm" />
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading drivers...</div>
            ) : drivers.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No pending drivers found.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {drivers.map(driver => (
                  <li key={driver._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex space-x-4">
                        <div className="h-16 w-16 bg-gray-200 rounded-full overflow-hidden">
                          {driver.driverPhoto ? (
                            <img src={driver.driverPhoto} alt="Driver" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <User />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{driver.name || "Unknown Name"}</h3>
                          <p className="text-sm text-gray-500">{driver.email || "No Email"} | {driver.phone}</p>
                          <p className="text-xs font-semibold text-yellow-600 mt-1 uppercase">Status: {driver.driverStatus}</p>
                          <p className="text-sm text-gray-600 mt-2">License: {driver.license?.number || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleReject(driver._id)}
                          className="flex items-center px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                        >
                          <XCircle size={18} className="mr-2" /> Reject
                        </button>
                        <button
                          onClick={() => handleVerify(driver._id)}
                          className="flex items-center px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                        >
                          <CheckCircle size={18} className="mr-2" /> Approve
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-4">
                        <div className="flex-1 bg-gray-50 p-4 rounded-lg flex flex-col items-center">
                            <span className="text-xs text-gray-400 mb-2 uppercase">License Front</span>
                            {driver.license?.photo ? 
                                <img src={driver.license.photo} className="h-32 object-contain" alt="Front" /> : 
                                <div className="h-32 w-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 rounded">No Image</div>
                            }
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-lg flex flex-col items-center">
                            <span className="text-xs text-gray-400 mb-2 uppercase">Vehicle Registration</span>
                            {driver.registration?.photo ? 
                                <img src={driver.registration.photo} className="h-32 object-contain" alt="Registration" /> : 
                                <div className="h-32 w-full bg-gray-200 flex items-center justify-center text-sm text-gray-500 rounded">No Image</div>
                            }
                        </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;