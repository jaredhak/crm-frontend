import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const BACKEND_URL = "https://crm-project-production-875a.up.railway.app"

export default function CRMLeadDashboard() {
  const [leads, setLeads] = useState([])
  const [messages, setMessages] = useState([])
  const [newLead, setNewLead] = useState({ name: "", phone: "", source: "", notes: "" })
  const [todayFollowUps, setTodayFollowUps] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchLeads()
    fetchMessages()
  }, [])

  const fetchLeads = async () => {
    const res = await fetch(`${BACKEND_URL}/leads`)
    const data = await res.json()
    setLeads(data)

    const today = new Date().toISOString().split("T")[0]
    const followUps = data.filter((lead) => lead.follow_up_date && lead.follow_up_date.startsWith(today))
    setTodayFollowUps(followUps)
  }

  const fetchMessages = async () => {
    const res = await fetch(`${BACKEND_URL}/messages`)
    const data = await res.json()
    setMessages(data)
  }

  const handleChange = (e) => {
    setNewLead({ ...newLead, [e.target.name]: e.target.value })
  }

  const addLead = async () => {
    await fetch(`${BACKEND_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLead),
    })
    setNewLead({ name: "", phone: "", source: "", notes: "" })
    fetchLeads()
  }

  const sendText = async (lead) => {
    const message = `Hi ${lead.name}, just following up! Let us know if you have any questions.`
    await fetch(`${BACKEND_URL}/send-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: lead.phone, message }),
    })
    alert(`Text sent to ${lead.name}`)
    fetchMessages()
  }

  const getMessagesForLead = (phone) => {
    return messages.filter(msg => msg.phone === phone)
  }

  const filteredLeads = leads.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  )

  return (
    <div className="p-6 space-y-6">
      <Card className="p-4">
        <CardContent className="space-y-2">
          <h2 className="text-xl font-semibold">Add New Lead</h2>
          <Input placeholder="Name" name="name" value={newLead.name} onChange={handleChange} />
          <Input placeholder="Phone" name="phone" value={newLead.phone} onChange={handleChange} />
          <Input placeholder="Source" name="source" value={newLead.source} onChange={handleChange} />
          <Textarea placeholder="Notes" name="notes" value={newLead.notes} onChange={handleChange} />
          <Button onClick={addLead}>Add Lead</Button>
        </CardContent>
      </Card>

      {todayFollowUps.length > 0 && (
        <Card className="p-4 border border-yellow-500">
          <CardContent className="space-y-2">
            <h2 className="text-lg font-semibold text-yellow-600">Follow-Ups Due Today</h2>
            {todayFollowUps.map((lead) => (
              <div key={lead.id} className="text-sm flex items-center justify-between">
                <div>
                  <strong>{lead.name}</strong> - {lead.phone} ({lead.source})
                </div>
                <Button size="sm" onClick={() => sendText(lead)}>Send Text</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Input
        placeholder="Search by name or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/2"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="p-4">
            <CardContent>
              <h3 className="text-lg font-medium">{lead.name}</h3>
              <p className="text-sm">Phone: {lead.phone}</p>
              <p className="text-sm">Source: {lead.source}</p>
              <p className="text-sm">Notes: {lead.notes}</p>
              <p className="text-xs text-muted-foreground">Follow up: {new Date(lead.follow_up_date).toLocaleDateString()}</p>
              <Button className="mt-2" size="sm" onClick={() => sendText(lead)}>Send Text</Button>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-semibold">Message History:</p>
                {getMessagesForLead(lead.phone).map((msg) => (
                  <p key={msg.id} className="text-xs text-muted-foreground">{new Date(msg.sent_at).toLocaleString()} - {msg.message}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <CardContent className="space-y-2">
          <h2 className="text-xl font-semibold">Message History (All)</h2>
          {messages.map((msg) => (
            <div key={msg.id} className="text-sm border-b pb-2">
              <p><strong>To:</strong> {msg.phone}</p>
              <p><strong>Message:</strong> {msg.message}</p>
              <p className="text-xs text-muted-foreground">Sent: {new Date(msg.sent_at).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
