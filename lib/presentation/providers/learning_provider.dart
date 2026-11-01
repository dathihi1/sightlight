import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/dio_client.dart';
import '../../data/datasources/learning_remote_datasource.dart';
import '../../data/repositories/learning_repository_impl.dart';
import '../../domain/entities/learning.dart';
import '../../domain/repositories/learning_repository.dart';
import 'auth_provider.dart';

final learningRepositoryProvider = Provider<LearningRepository>((ref) {
  return LearningRepositoryImpl(
    LearningRemoteDataSource(ref.watch(dioProvider)),
  );
});

final coursesProvider = FutureProvider<List<CourseSummary>>((ref) {
  return ref.watch(learningRepositoryProvider).getCourses();
});

final learningPathProvider = FutureProvider<LearningPath>((ref) async {
  final repository = ref.watch(learningRepositoryProvider);
  final user = ref.watch(authStateProvider).valueOrNull;
  var courseId = user?.activeCourseId;
  if (courseId == null || courseId.isEmpty) {
    final courses = await repository.getCourses();
    final available = courses.where((course) => !course.comingSoon).toList();
    if (available.isEmpty) {
      throw StateError('Hiện chưa có khóa học nào đang mở.');
    }
    courseId = available.first.id;
  }
  return repository.getLearningPath(courseId);
});

final lessonDetailProvider = FutureProvider.autoDispose
    .family<LessonDetail, String>((ref, lessonId) {
      return ref.watch(learningRepositoryProvider).getLesson(lessonId);
    });
