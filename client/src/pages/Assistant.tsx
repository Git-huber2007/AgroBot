import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Trash2, ArrowRight, Clock, Sprout } from 'lucide-react';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { useActiveFarm } from '../hooks/useActiveFarm';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDateTime } from '../lib/formatters';

export interface ChatSession {
  id: string;
  title: string;
  farm_id: string | null;
  farm?: { name: string } | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export const Assistant: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeFarm } = useActiveFarm();
  const { profile } = useAuth();
  const { success, error } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<ChatSession[]>({
    queryKey: queryKeys.chatSessions,
    queryFn: () => api.get<ChatSession[]>('/chat/sessions'),
  });

  const handleCreateSession = async () => {
    setIsCreating(true);
    try {
      const newSession = await api.post<ChatSession>('/chat/sessions', {
        farmId: activeFarm?.id || undefined,
        language: profile?.preferred_language || 'en',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions });
      navigate(`/assistant/${newSession.id}`);
    } catch (err: any) {
      error(err.message || 'Failed to start conversation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/sessions/${id}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions });
      success('Conversation deleted.');
    } catch (err: any) {
      error(err.message || 'Failed to delete conversation');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Multilingual Farm Assistant"
        subtitle="Conversational advice grounded in your active farm soil and weather conditions."
        actions={
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleCreateSession}
            isLoading={isCreating}
          >
            New Conversation
          </Button>
        }
      />

      {/* Farm Context Banner */}
      {activeFarm && (
        <div className="p-3.5 bg-leaf-50/70 border border-leaf-200 rounded-xl text-xs text-leaf-900 flex items-center gap-2">
          <Sprout className="w-4 h-4 text-leaf-600 shrink-0" />
          <span>
            Conversations will automatically use farm context from:{' '}
            <strong>{activeFarm.name}</strong> ({activeFarm.district}, {activeFarm.state})
          </span>
        </div>
      )}

      {/* Session List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-2 border-stone-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900 font-display">No Conversations Yet</h3>
          <p className="text-sm text-stone-600 max-w-sm mx-auto">
            Ask questions about weed control, fertilizer scheduling, weather impacts, or government
            agri-schemes.
          </p>
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleCreateSession}
            isLoading={isCreating}
          >
            Start First Chat
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card
              key={session.id}
              onClick={() => navigate(`/assistant/${session.id}`)}
              className="p-4 hover:border-leaf-300 hover:shadow-subtle transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-leaf-50 text-leaf-600 flex items-center justify-center shrink-0 group-hover:bg-leaf-600 group-hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 truncate">{session.title}</h4>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                    <span>{formatDateTime(session.updated_at)}</span>
                    {session.farm?.name && (
                      <span className="text-leaf-700 font-medium truncate">
                        • {session.farm.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="p-2 text-stone-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
