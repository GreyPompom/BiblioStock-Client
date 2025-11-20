// src/components/AutoresPage.tsx
import { useState, useEffect } from 'react';
import { getProdutos } from '../lib/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import type { AuthorRequestDTO, AuthorResponseDTO, AutorFormData } from '../types/authors.dto';
import { getAuthors, createAuthor, updateAuthor, deleteAuthor } from '../lib/api/authorsApi';


const mapFormToRequestDto = (form: AutorFormData): AuthorRequestDTO => ({
  fullName: form.nomeCompleto,
  nationality: form.nacionalidade,
  biography: form.biografia || null,
  birthDate: form.dataNascimento || null,
});

export function AutoresPage() {
  const [autores, setAutores] = useState<AuthorResponseDTO[]>([]);
  const [filteredAutores, setFilteredAutores] = useState<AuthorResponseDTO[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [autorToDelete, setAutorToDelete] = useState<number | null>(null);
  const [editingAutor, setEditingAutor] = useState<AuthorResponseDTO | null>(null);
  const [detailsAutor, setDetailsAutor] = useState<AuthorResponseDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<AutorFormData>({
    nomeCompleto: '',
    nacionalidade: '',
    biografia: '',
    dataNascimento: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const apiAutores = await getAuthors();
      setAutores(apiAutores);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar autores do servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...autores];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.fullName.toLowerCase().includes(term) ||
          a.nationality.toLowerCase().includes(term),
      );
    }
    setFilteredAutores(filtered);
  }, [autores, searchTerm]);

  const resetForm = () => {
    setFormData({
      nomeCompleto: '',
      nacionalidade: '',
      biografia: '',
      dataNascimento: '',
    });
    setEditingAutor(null);
  };

  const handleOpenDialog = (autor?: AuthorResponseDTO) => {
    if (autor) {
      setEditingAutor(autor);
      setFormData({
        nomeCompleto: autor.fullName,
        nacionalidade: autor.nationality,
        biografia: autor.biography ?? '',
        dataNascimento: autor.birthDate ?? '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nomeCompleto || !formData.nacionalidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const payload: AuthorRequestDTO = mapFormToRequestDto(formData);

    try {
      setIsLoading(true);

      if (editingAutor) {
        const updatedDto = await updateAuthor(editingAutor.id, payload);
        setAutores(prev =>
          prev.map(a => (a.id === editingAutor.id ? updatedDto : a)),
        );
        toast.success('Autor atualizado com sucesso!');
      } else {
        const createdDto = await createAuthor(payload);
        setAutores(prev => [...prev, createdDto]);
        toast.success('Autor cadastrado com sucesso!');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar autor. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLivrosDoAutor = (autorId: number) => {
    const produtos = getProdutos(); // ainda vindo do storage
    return produtos.filter(p => p.authorIds.includes(String(autorId)));
  };

  const handleDelete = (id: number) => {
    const livrosVinculados = getLivrosDoAutor(id);

    if (livrosVinculados.length > 0) {
      toast.error(
        `Não é possível excluir este autor pois está vinculado a ${livrosVinculados.length} livro(s).`,
        { duration: 4000 },
      );
      return;
    }

    setAutorToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (autorToDelete == null) return;

    try {
      setIsLoading(true);
      await deleteAuthor(autorToDelete);
      setAutores(prev => prev.filter(a => a.id !== autorToDelete));
      toast.success('Autor excluído com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error(
        'Erro ao excluir autor. Verifique se ele não está vinculado a livros ou tente novamente.',
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setAutorToDelete(null);
      setIsLoading(false);
    }
  };

  const handleViewDetails = (autor: AuthorResponseDTO) => {
    setDetailsAutor(autor);
    setIsDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>Gerenciamento de Autores</h2>
          <p className="text-muted-foreground">
            Cadastre e gerencie os autores dos livros da livraria
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={isLoading}>
          <Plus className="size-4" />
          Novo Autor
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou nacionalidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Nacionalidade</TableHead>
              <TableHead>Livros Vinculados</TableHead>
              <TableHead>Data de Aniversário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAutores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum autor encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredAutores.map(autor => {
                const livrosVinculados = getLivrosDoAutor(autor.id);
                return (
                  <TableRow key={autor.id}>
                    <TableCell>{autor.id}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewDetails(autor)}
                        className="hover:underline"
                      >
                        {autor.fullName}
                      </button>
                    </TableCell>
                    <TableCell>{autor.nationality}</TableCell>
                    <TableCell>
                      {livrosVinculados.length > 0 ? (
                        <Badge variant="secondary" className="gap-1">
                          <BookOpen className="size-3" />
                          {livrosVinculados.length}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Nenhum</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {
                        autor.birthDate ? new Date(autor.birthDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(autor)}
                          disabled={isLoading}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(autor.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingAutor ? 'Editar Autor' : 'Novo Autor'}</DialogTitle>
            <DialogDescription>Preencha as informações do autor abaixo</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nomeCompleto">Nome Completo *</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={e =>
                  setFormData({ ...formData, nomeCompleto: e.target.value })
                }
                placeholder="Ex: Machado de Assis"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nacionalidade">Nacionalidade *</Label>
              <Input
                id="nacionalidade"
                value={formData.nacionalidade}
                onChange={e =>
                  setFormData({ ...formData, nacionalidade: e.target.value })
                }
                placeholder="Ex: Brasileira"
              />
            </div>
            <div className="grid gap-2"> 
              <Label htmlFor="dataNascimento">Data de Nascimento *</Label> 
              <Input id="dataNascimento" type="date" value={formData.dataNascimento} 
              onChange={e => setFormData({ ...formData, dataNascimento: e.target.value })} 
              placeholder="Ex: 2005-09-15" /> </div>
            <div className="grid gap-2">
              <Label htmlFor="biografia">Biografia</Label>
              <Textarea
                id="biografia"
                value={formData.biografia}
                onChange={e =>
                  setFormData({ ...formData, biografia: e.target.value })
                }
                placeholder="Breve biografia do autor..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Autor</DialogTitle>
          </DialogHeader>
          {detailsAutor && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Nome Completo</Label>
                <p>{detailsAutor.fullName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nacionalidade</Label>
                <p>{detailsAutor.nationality}</p>
              </div>
              {detailsAutor.biography && (
                <div>
                  <Label className="text-muted-foreground">Biografia</Label>
                  <p className="whitespace-pre-wrap">{detailsAutor.biography}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Data de Cadastro</Label>
                <p>
                  {detailsAutor.birthDate ? new Date(detailsAutor.birthDate).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Livros Publicados</Label>
                {getLivrosDoAutor(detailsAutor.id).length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {getLivrosDoAutor(detailsAutor.id).map(livro => (
                      <li key={livro.id} className="flex items-center gap-2">
                        <BookOpen className="size-4 text-muted-foreground" />
                        {livro.nome}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Nenhum livro vinculado</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este autor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
