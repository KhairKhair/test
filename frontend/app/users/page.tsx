"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar/navbar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Edit } from "lucide-react";

interface User {
  username: string;
  permissions: Record<string, string>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPermissions, setFormPermissions] = useState<Record<string, string>>({});

  // Fetch users and permissions options on mount
  useEffect(() => {
    fetch("http://localhost:8000/users", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => setUsers(data.users))
      .catch(console.error);

    fetch("http://localhost:8000/permissions/options", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setModules(data.modules);
        setLevels(data.levels);
      })
      .catch(console.error);
  }, []);

  const openAdd = () => {
    setSelectedUser(null);
    setFormUsername("");
    setFormPassword("");
    // default permissions to 'None'
    const initialPerms: Record<string, string> = {};
    modules.forEach((m) => {
      initialPerms[m] = "None";
    });
    setFormPermissions(initialPerms);
    setOpen(true);
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setFormUsername(user.username);
    setFormPassword(""); // not changed
    setFormPermissions({ ...user.permissions });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
  };

  const onSubmit = async () => {
    try {
      if (selectedUser) {
        // update permissions
        await fetch(
          `http://localhost:8000/permissions/${selectedUser.username}/permissions`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formPermissions),
          }
        );
      } else {
        // create new user
        await fetch("http://localhost:8000/users/new", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formUsername,
            password: formPassword,
            permissions: formPermissions,
          }),
        });
      }
      // refresh list
      const res = await fetch("http://localhost:8000/users", {
        credentials: "include",
      });
      const data = await res.json();
      setUsers(data.users);
      closeDialog();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="User Management" />
      <main className="p-6">
        <Card>
          <CardHeader className="flex items-center justify-between pb-0">
            <CardTitle>Users</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openAdd}>
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedUser ? "Edit Permissions" : "Add User"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedUser
                      ? `Update permissions for ${selectedUser.username}`
                      : "Enter username, password, and permissions"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {!selectedUser && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          Username
                        </Label>
                        <Input
                          id="username"
                          className="col-span-3"
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password
                        </Label>
                        <Input
                          id="password"
                          className="col-span-3"
                          type="password"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {modules.map((mod) => (
                    <div
                      key={mod}
                      className="grid grid-cols-4 items-center gap-4"
                    >
                      <Label htmlFor={`perm-${mod}`} className="text-right">
                        {mod.replace("_", " ")}
                      </Label>
                      <Select
                        value={formPermissions[mod]}
                        onValueChange={(val) =>
                          setFormPermissions((prev) => ({ ...prev, [mod]: val }))
                        }
                      >
                        <SelectTrigger id={`perm-${mod}`} className="col-span-3">
                          <SelectValue placeholder="Select permission" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((lvl) => (
                            <SelectItem key={lvl} value={lvl}>
                              {lvl}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button onClick={onSubmit}>
                    {selectedUser ? "Save" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader className="bg-sky-100">
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.username} className="even:bg-gray-50">
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {modules
                        .map(
                          (m) =>
                            `${m.replace("_", " ")}: ${user.permissions[m]}`
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={open && selectedUser?.username === user.username}
                        onOpenChange={(open) => {
                          if (!open) closeDialog();
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
