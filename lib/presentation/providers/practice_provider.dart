import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/dio_client.dart';
import '../../core/storage/shared_prefs_provider.dart';
import '../../data/datasources/practice_local_datasource.dart';
import '../../data/datasources/practice_remote_datasource.dart';
import '../../data/models/practice/practice_model.dart';
import '../../data/repositories/practice_repository_impl.dart';
import '../../domain/repositories/practice_repository.dart';

final practiceRepositoryProvider = Provider<PracticeRepository>((ref) {
  final dio = ref.watch(dioProvider);
  final prefs = ref.watch(sharedPreferencesProvider);
  final remote = PracticeRemoteDataSource(dio);
  final local = PracticeLocalDataSource(prefs);
  return PracticeRepositoryImpl(remote, local);
});

// Practice Stats Provider
final practiceStatsProvider =
    StateNotifierProvider<PracticeStatsNotifier, PracticeStats>((ref) {
      final repo = ref.watch(practiceRepositoryProvider);
      return PracticeStatsNotifier(repo);
    });

class PracticeStatsNotifier extends StateNotifier<PracticeStats> {
  PracticeStatsNotifier(this._repository)
    : super(_repository.getPracticeStats());

  final PracticeRepository _repository;

  Future<void> recordSession({
    required int answered,
    required int correct,
  }) async {
    final updated = await _repository.recordSessionResult(
      answered: answered,
      correct: correct,
    );
    state = updated;
  }

  Future<void> reset() async {
    await _repository.resetStats();
    state = const PracticeStats();
  }
}

// ----------------- Vocabulary Practice -----------------

class VocabularyPracticeState {
  const VocabularyPracticeState({
    this.session,
    this.currentIndex = 0,
    this.selectedAnswer,
    this.isAnswered = false,
    this.isCorrect = false,
    this.score = 0,
    this.isLoading = false,
    this.isCompleted = false,
    this.errorMessage,
  });

  final VocabularySession? session;
  final int currentIndex;
  final String? selectedAnswer;
  final bool isAnswered;
  final bool isCorrect;
  final int score;
  final bool isLoading;
  final bool isCompleted;
  final String? errorMessage;

  PracticeQuestion? get currentQuestion {
    if (session == null ||
        currentIndex < 0 ||
        currentIndex >= session!.items.length) {
      return null;
    }
    return session!.items[currentIndex];
  }

  int get totalQuestions => session?.items.length ?? 0;
  double get progress =>
      totalQuestions == 0 ? 0.0 : (currentIndex + 1) / totalQuestions;

  VocabularyPracticeState copyWith({
    VocabularySession? session,
    int? currentIndex,
    String? selectedAnswer,
    bool? isAnswered,
    bool? isCorrect,
    int? score,
    bool? isLoading,
    bool? isCompleted,
    String? errorMessage,
  }) {
    return VocabularyPracticeState(
      session: session ?? this.session,
      currentIndex: currentIndex ?? this.currentIndex,
      selectedAnswer: selectedAnswer ?? this.selectedAnswer,
      isAnswered: isAnswered ?? this.isAnswered,
      isCorrect: isCorrect ?? this.isCorrect,
      score: score ?? this.score,
      isLoading: isLoading ?? this.isLoading,
      isCompleted: isCompleted ?? this.isCompleted,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

final vocabularyPracticeProvider =
    StateNotifierProvider.autoDispose<
      VocabularyPracticeNotifier,
      VocabularyPracticeState
    >((ref) {
      final repo = ref.watch(practiceRepositoryProvider);
      final statsNotifier = ref.watch(practiceStatsProvider.notifier);
      return VocabularyPracticeNotifier(repo, statsNotifier);
    });

class VocabularyPracticeNotifier
    extends StateNotifier<VocabularyPracticeState> {
  VocabularyPracticeNotifier(this._repository, this._statsNotifier)
    : super(const VocabularyPracticeState(isLoading: true)) {
    loadSession();
  }

  final PracticeRepository _repository;
  final PracticeStatsNotifier _statsNotifier;

  Future<void> loadSession() async {
    state = const VocabularyPracticeState(isLoading: true);
    try {
      final session = await _repository.getVocabularySession();
      state = VocabularyPracticeState(session: session, isLoading: false);
    } catch (e) {
      state = VocabularyPracticeState(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  void selectAnswer(String answer) {
    if (state.isAnswered || state.currentQuestion == null) return;

    final question = state.currentQuestion!;
    final isCorrect =
        answer.trim().toLowerCase() ==
        question.correctAnswer.trim().toLowerCase();

    final newScore = isCorrect ? state.score + 1 : state.score;

    state = state.copyWith(
      selectedAnswer: answer,
      isAnswered: true,
      isCorrect: isCorrect,
      score: newScore,
    );

    // Report answer to API
    _repository.submitVocabularyAnswer(
      PracticeAnswer(
        sessionId: state.session?.sessionId ?? '',
        questionId: question.id,
        selectedAnswer: answer,
        isCorrect: isCorrect,
      ),
    );
  }

  void nextQuestion() {
    if (state.session == null) return;

    final nextIndex = state.currentIndex + 1;
    if (nextIndex < state.session!.items.length) {
      state = state.copyWith(
        currentIndex: nextIndex,
        selectedAnswer: null,
        isAnswered: false,
        isCorrect: false,
      );
    } else {
      // Completed session
      state = state.copyWith(isCompleted: true);
      _statsNotifier.recordSession(
        answered: state.totalQuestions,
        correct: state.score,
      );
    }
  }

  void restart() {
    loadSession();
  }
}

// ----------------- Fingerspell Practice -----------------

class FingerspellPracticeState {
  const FingerspellPracticeState({
    this.session,
    this.currentIndex = 0,
    this.enteredLetters = const [],
    this.isAnswered = false,
    this.isCorrect = false,
    this.score = 0,
    this.isLoading = false,
    this.isCompleted = false,
    this.showCamera = false,
    this.errorMessage,
  });

  final FingerspellSession? session;
  final int currentIndex;
  final List<String> enteredLetters;
  final bool isAnswered;
  final bool isCorrect;
  final int score;
  final bool isLoading;
  final bool isCompleted;
  final bool showCamera;
  final String? errorMessage;

  FingerspellItem? get currentItem {
    if (session == null ||
        currentIndex < 0 ||
        currentIndex >= session!.items.length) {
      return null;
    }
    return session!.items[currentIndex];
  }

  int get totalItems => session?.items.length ?? 0;
  double get progress =>
      totalItems == 0 ? 0.0 : (currentIndex + 1) / totalItems;

  String get currentInput => enteredLetters.join();

  FingerspellPracticeState copyWith({
    FingerspellSession? session,
    int? currentIndex,
    List<String>? enteredLetters,
    bool? isAnswered,
    bool? isCorrect,
    int? score,
    bool? isLoading,
    bool? isCompleted,
    bool? showCamera,
    String? errorMessage,
  }) {
    return FingerspellPracticeState(
      session: session ?? this.session,
      currentIndex: currentIndex ?? this.currentIndex,
      enteredLetters: enteredLetters ?? this.enteredLetters,
      isAnswered: isAnswered ?? this.isAnswered,
      isCorrect: isCorrect ?? this.isCorrect,
      score: score ?? this.score,
      isLoading: isLoading ?? this.isLoading,
      isCompleted: isCompleted ?? this.isCompleted,
      showCamera: showCamera ?? this.showCamera,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

final fingerspellPracticeProvider =
    StateNotifierProvider.autoDispose<
      FingerspellPracticeNotifier,
      FingerspellPracticeState
    >((ref) {
      final repo = ref.watch(practiceRepositoryProvider);
      final statsNotifier = ref.watch(practiceStatsProvider.notifier);
      return FingerspellPracticeNotifier(repo, statsNotifier);
    });

class FingerspellPracticeNotifier
    extends StateNotifier<FingerspellPracticeState> {
  FingerspellPracticeNotifier(this._repository, this._statsNotifier)
    : super(const FingerspellPracticeState(isLoading: true)) {
    loadSession();
  }

  final PracticeRepository _repository;
  final PracticeStatsNotifier _statsNotifier;

  Future<void> loadSession() async {
    state = const FingerspellPracticeState(isLoading: true);
    try {
      final session = await _repository.getFingerspellSession();
      state = FingerspellPracticeState(session: session, isLoading: false);
    } catch (e) {
      state = FingerspellPracticeState(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  void addLetter(String letter) {
    if (state.isAnswered || state.currentItem == null) return;
    final updated = [...state.enteredLetters, letter.toUpperCase()];
    state = state.copyWith(enteredLetters: updated);

    // Auto check if target word length reached
    final target = state.currentItem!.letters.join();
    if (updated.length >= target.length) {
      checkAttempt();
    }
  }

  void deleteLetter() {
    if (state.isAnswered || state.enteredLetters.isEmpty) return;
    final updated = List<String>.from(state.enteredLetters)..removeLast();
    state = state.copyWith(enteredLetters: updated);
  }

  void clearInput() {
    if (state.isAnswered) return;
    state = state.copyWith(enteredLetters: const []);
  }

  void toggleCamera() {
    state = state.copyWith(showCamera: !state.showCamera);
  }

  void checkAttempt() {
    if (state.isAnswered || state.currentItem == null) return;
    final target = state.currentItem!.letters.join();
    final input = state.currentInput;
    final isCorrect = input.toUpperCase() == target.toUpperCase();
    final newScore = isCorrect ? state.score + 1 : state.score;

    state = state.copyWith(
      isAnswered: true,
      isCorrect: isCorrect,
      score: newScore,
    );

    _repository.submitFingerspellAttempt(
      PracticeAnswer(
        sessionId: state.session?.sessionId ?? '',
        questionId: state.currentItem!.id,
        selectedAnswer: input,
        isCorrect: isCorrect,
      ),
    );
  }

  void nextItem() {
    if (state.session == null) return;
    final nextIndex = state.currentIndex + 1;
    if (nextIndex < state.session!.items.length) {
      state = state.copyWith(
        currentIndex: nextIndex,
        enteredLetters: const [],
        isAnswered: false,
        isCorrect: false,
      );
    } else {
      state = state.copyWith(isCompleted: true);
      _statsNotifier.recordSession(
        answered: state.totalItems,
        correct: state.score,
      );
    }
  }

  void restart() {
    loadSession();
  }
}

// ----------------- Numbers Practice -----------------

final numbersPracticeProvider =
    StateNotifierProvider.autoDispose<
      NumbersPracticeNotifier,
      VocabularyPracticeState
    >((ref) {
      final repo = ref.watch(practiceRepositoryProvider);
      final statsNotifier = ref.watch(practiceStatsProvider.notifier);
      return NumbersPracticeNotifier(repo, statsNotifier);
    });

class NumbersPracticeNotifier extends StateNotifier<VocabularyPracticeState> {
  NumbersPracticeNotifier(this._repository, this._statsNotifier)
    : super(const VocabularyPracticeState(isLoading: true)) {
    loadSession();
  }

  final PracticeRepository _repository;
  final PracticeStatsNotifier _statsNotifier;

  Future<void> loadSession() async {
    state = const VocabularyPracticeState(isLoading: true);
    try {
      final session = await _repository.getNumbersSession();
      state = VocabularyPracticeState(session: session, isLoading: false);
    } catch (e) {
      state = VocabularyPracticeState(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  void selectAnswer(String answer) {
    if (state.isAnswered || state.currentQuestion == null) return;

    final question = state.currentQuestion!;
    final isCorrect =
        answer.trim().toLowerCase() ==
        question.correctAnswer.trim().toLowerCase();

    final newScore = isCorrect ? state.score + 1 : state.score;

    state = state.copyWith(
      selectedAnswer: answer,
      isAnswered: true,
      isCorrect: isCorrect,
      score: newScore,
    );

    _repository.submitVocabularyAnswer(
      PracticeAnswer(
        sessionId: state.session?.sessionId ?? '',
        questionId: question.id,
        selectedAnswer: answer,
        isCorrect: isCorrect,
      ),
    );
  }

  void nextQuestion() {
    if (state.session == null) return;

    final nextIndex = state.currentIndex + 1;
    if (nextIndex < state.session!.items.length) {
      state = state.copyWith(
        currentIndex: nextIndex,
        selectedAnswer: null,
        isAnswered: false,
        isCorrect: false,
      );
    } else {
      state = state.copyWith(isCompleted: true);
      _statsNotifier.recordSession(
        answered: state.totalQuestions,
        correct: state.score,
      );
    }
  }

  void restart() {
    loadSession();
  }
}
