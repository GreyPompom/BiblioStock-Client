import { useState, useEffect } from 'react';
import { Autor } from '../types';
import { getAutores, saveAutores, getProdutos } from '../lib/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Textarea } from './ui/textarea';
import { Plus, Pencil, Trash2, Search, BookOpen } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

export function AutoresPage() {
  const [autores, setAutores] = useState<Autor[]>([]);
  const [filteredAutores, setFilteredAutores] = useState<Autor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [autorToDelete, setAutorToDelete] = useState<string | null>(null);
  const [editingAutor, setEditingAutor] = useState<Autor | null>(null);
  const [detailsAutor, setDetailsAutor] = useState<Autor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    nacionalidade: '',
    biografia: '',
    dataNascimento: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAutores();
  }, [autores, searchTerm]);

  const loadData = () => {
    setAutores(getAutores());
  };

  const filterAutores = () => {
    let filtered = [...autores];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.nomeCompleto.toLowerCase().includes(term) ||
        a.nacionalidade.toLowerCase().includes(term)
      );
    }

    setFilteredAutores(filtered);
  };

  const resetForm = () => {
    setFormData({
      nomeCompleto: '',
      nacionalidade: '',
      biografia: '',
      dataNascimento: '',
    });
    setEditingAutor(null);
  };

  const handleOpenDialog = (autor?: Autor) => {
    if (autor) {
      setEditingAutor(autor);
      setFormData({
        nomeCompleto: autor.nomeCompleto,
        nacionalidade: autor.nacionalidade,
        biografia: autor.biografia,
        dataNascimento: autor.dataNascimento || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nomeCompleto || !formData.nacionalidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const novoAutor: Autor = {
      id: editingAutor?.id || Date.now().toString(),
      nomeCompleto: formData.nomeCompleto,
      nacionalidade: formData.nacionalidade,
      biografia: formData.biografia,
      dataNascimento: formData.dataNascimento,
    };

    const updatedAutores = editingAutor
      ? autores.map(a => a.id === editingAutor.id ? novoAutor : a)
      : [...autores, novoAutor];

    saveAutores(updatedAutores);
    setAutores(updatedAutores);
    setIsDialogOpen(false);
    resetForm();
    toast.success(editingAutor ? 'Autor atualizado com sucesso!' : 'Autor cadastrado com sucesso!');
  };

  const handleDelete = (id: string) => {
    // Verificar se o autor está vinculado a algum livro (RN008 e RF016)
    const produtos = getProdutos();
    const livrosVinculados = produtos.filter(p => p.authorIds.includes(id));
    
    if (livrosVinculados.length > 0) {
      toast.error(
        `Não é possível excluir este autor pois está vinculado a ${livrosVinculados.length} livro(s).`,
        { duration: 4000 }
      );
      return;
    }

    setAutorToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (autorToDelete) {
      const updatedAutores = autores.filter(a => a.id !== autorToDelete);
      saveAutores(updatedAutores);
      setAutores(updatedAutores);
      toast.success('Autor excluído com sucesso!');
    }
    setIsDeleteDialogOpen(false);
    setAutorToDelete(null);
  };

  const handleViewDetails = (autor: Autor) => {
    setDetailsAutor(autor);
    setIsDetailsDialogOpen(true);
  };

  const getLivrosDoAutor = (autorId: string) => {
    const produtos = getProdutos();
    return produtos.filter(p => p.authorIds.includes(autorId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>Gerenciamento de Autores</h2>
          <p className="text-muted-foreground">Cadastre e gerencie os autores dos livros da livraria</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
              <TableHead>Data de Nascimento</TableHead>
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
                        {autor.nomeCompleto}
                      </button>
                    </TableCell>
                    <TableCell>{autor.nacionalidade}</TableCell>
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
                      {autor.dataNascimento 
                        ? new Date(autor.dataNascimento).toLocaleDateString('pt-BR')
                        : <span className="text-muted-foreground">Não informada</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(autor)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(autor.id)}>
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
            <DialogDescription>
              Preencha as informações do autor abaixo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nomeCompleto">Nome Completo *</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                placeholder="Ex: Machado de Assis"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nacionalidade">Nacionalidade *</Label>
              <Input
                id="nacionalidade"
                value={formData.nacionalidade}
                onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                placeholder="Ex: Brasileira"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="biografia">Biografia</Label>
              <Textarea
                id="biografia"
                value={formData.biografia}
                onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                placeholder="Breve biografia do autor..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
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
                <p>{detailsAutor.nomeCompleto}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nacionalidade</Label>
                <p>{detailsAutor.nacionalidade}</p>
              </div>
              {detailsAutor.biografia && (
                <div>
                  <Label className="text-muted-foreground">Biografia</Label>
                  <p className="whitespace-pre-wrap">{detailsAutor.biografia}</p>
                </div>
              )}
              {detailsAutor.dataNascimento && (
                <div>
                  <Label className="text-muted-foreground">Data de Nascimento</Label>
                  <p>{new Date(detailsAutor.dataNascimento).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
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
            <Button onClick={() => setIsDetailsDialogOpen(false)}>
              Fechar
            </Button>
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