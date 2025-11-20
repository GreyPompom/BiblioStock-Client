
export interface AuthorResponseDTO {
  id: number;
  fullName: string;
  nationality: string;
  biography?: string | null;
  birthDate?: string | null;
}

export interface AuthorRequestDTO {
  fullName: string;
  nationality: string;
  biography?: string | null;
  birthDate?: string | null;
}
export interface AutorFormData {
  nomeCompleto: string;
  nacionalidade: string;
  biografia: string;
  dataNascimento?: string;
}
